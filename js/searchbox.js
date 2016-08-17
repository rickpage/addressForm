/*
 * Searchbox functionality to assist in searching and
 * selecting a desired address for use in JSON.
 * 
 * Usage:
 * 1. Write a function such as initAutocomplete that calls
function initAutocomplete(){
initializeSearchbox(
  { lat : starting_lat
  , lng : starting_lng
  , callback : fill_in_form_address_data }
 )
 ...
 }
 *
 * 2. call initAutocomplete from google api link i.e.
 * <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBWNNCsmSfb0gpZv3IuK1c91cctc2y6FYY&libraries=places&amp;callback=initAutocomplete"
         async defer
 *
 * 3. When user searches and/or clicks an icon, the
 * script stores that address data and fires a callback.
 * The default callback is:
 * 
 * fillInAddress(p)
 * 
 * p - place data
 * 
 * TODO: Explain prereqs for this to work out of box
 */
var addressData = {};
var _defaultLatLon = {lat: -33.8688, lng: 151.2195};

/**
 * args['lat'],args['lng'] - lat lon to center map on
 * args['callback'] the call back passed in
 */
function initializeSearchbox(args) {
        var lat=_defaultLatLon.lat
        ,lng=_defaultLatLon.lng
        ,callback=fillInAddress;
        if (args !== undefined) {

          if ( "lng" in args) {
              lng = args['lng'];
          }
          if ("lat" in args) {
              lat = args['lat'];
          }
          
          if ("callback" in args) {
            callback = args["callback"];
          }
        }
        
        var map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: lat, lng: lng},
          zoom: 13,
          mapTypeId: 'roadmap'
          , types: 'establishment'
        });
        
        init(map, callback);
}


function init(map, callback) {
        

        // Create the search box and link it to the UI element.
        var input = document.getElementById('pac-input');
        var searchBox = new google.maps.places.SearchBox(input);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
        // PlacesService for place details
        var service = new google.maps.places.PlacesService(map);

        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function() {
          searchBox.setBounds(map.getBounds());
        });

        var markers = [];
        // handler user select
        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox.addListener('places_changed', function() {
          var places = searchBox.getPlaces();

          if (places.length == 0) {
            return;
          } else {
            console.log("Processing " + places.length + " # of places");
          }
          // Only one result? Great, populate now
          if (places.length == 1) {
            // TODO: Could be an ATM, need consistent filtering
            // use fetch, gets more info only if needed
            fetchPlaceAddress(places[0], service, callback);
          }
          
          // Clear out the old markers.
          markers.forEach(function(marker) {
            marker.setMap(null);
          });
          markers = [];

          // update the bounds as results come in
          // TODO: Don't do this when we ignore results, otherwise
          // our old bounds will be reset when we should instead warn of no
          // results
          var bounds = new google.maps.LatLngBounds();
          
          // For each place, get the icon, name and location.
          places.forEach(function(place) {
            if (!place.geometry) {
                var n;
                if (!place.name) {
                    n = "(Un-named place)";
                }
                else {
                    n = place.name;
                }
              console.log(n + " contains no geometry");
              return;
            }
            // TODO: Filter out un-used places
            var x = -1;
            // ignore a certain type of result
            //if (place.types) {
            //    var type = 'atm';
            //    x = place.types.indexOf(type)
            //    console.log(type + ' place' + place.name + ' found at index ' + x)
            //}
            
            if (true){ //TODO: filering if(x != 0 ){
                
                var icon = {
                  url: place.icon,
                  size: new google.maps.Size(34, 34),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(17, 34),
                  scaledSize: new google.maps.Size(25, 25)
                };
    
                // Create a marker for each place.
                var marker = new google.maps.Marker({
                  map: map,
                  icon: icon,
                  title: place.name,
                  position: place.geometry.location
                });
                markers.push(marker);
                var p = place;
                marker.addListener('click', clickHandlerForPlace(p, service, callback));
                
                // calculate new view bounds
                if (place.geometry.viewport) {
                  // Only geocodes have viewport.
                  bounds.union(place.geometry.viewport);
                } else {
                  bounds.extend(place.geometry.location);
                }
            } // end if for filtering
          });
          
          // set view bounds
          map.fitBounds(bounds);
        }); // end handler
        
        // don't show icons unless we place them
        // but show roads and administrative labels
        var remove_poi = [
         {
           "featureType": "all",
           "elementType": "labels",
           "stylers": [
             { "visibility": "off" }
           ]
         },
          {
           "featureType": "road",
           "elementType": "labels",
           "stylers": [
             { "visibility": "on" }
           ]
         },
          {
           "featureType": "administrative",
           "elementType": "labels",
           "stylers": [
             { "visibility": "on" }
           ]
         }
       ]
       map.setOptions({styles: remove_poi})
      }

      function storeAddressData(place) {
        // TODO: Rename to Address Details = {} or similar
        addressData = {};
        // These correspond address components that require short or long key for values
        var addressComponentKeys = {
            street_number: 'short_name',
            route: 'long_name',
            locality: 'long_name',
            administrative_area_level_1: 'short_name',
            administrative_area_level_2: 'short_name',
            // country: 'long_name',
            postal_code: 'short_name',
          };
          
          // Get each component of the address from the place details
        // and fill the corresponding field on the form.
        for (var i = 0; i < place.address_components.length; i++) {
          
          // LOG  
          console.log(place.address_components[i].types[0] + " = "
                        + place.address_components[i]["short_name"]);
          // addressType here corresponds to the keys in componentForm
          var addressType = place.address_components[i].types[0];
          if (addressComponentKeys[addressType]) {
            var val = place.address_components[i][addressComponentKeys[addressType]];
            // store
            addressData[addressType] = val;
          }
        }
         // formatted address
        var formatted = place.formatted_address;
        addressData['formatted_address'] = formatted;
        
        // phone
        var phone = place.formatted_phone_number;
        addressData['formatted_phone_number'] = phone;
        // info url
        var url = place.url;
        addressData['link'] = "<a href=\""+url+"\" >More Info</a>";
        // GPS lat lon
        var lat, lng;
        lat = place.geometry.location.lat();
        lng = place.geometry.location.lng();

        addressData['lat'] = lat;
        addressData['lng'] = lng;
        
        for (var i in addressData){
          console.log(i + " : " + addressData[i])
        }
        
      }
      /*
       * Fill In address (by element ID)
       * Take place details and fill in the form
       * elements with the values
       * If the value is undefined, 'undefined' is
       * used as the innerHTML or value
       */
      function fillInAddress(place,status) {
        var e = null;
        var mapping = {
          "lat" : "location_lat"
          , "lng" : "location_lng"
          , 
        }
        var mapvalue= null;
        // TODO: if bad status, show error
        for ( var i in addressData ){
          // get mapping if any
          mapvalue = mapping[i];
          if (mapvalue == null) {
            mapvalue = i;
          }
          e = document.getElementById(mapvalue);
          if ( e != null) {
            if (e.tagName.toLowerCase() == "input") {
                e.value = addressData[i];
            } else {
              e.innerHTML = addressData[i];
            }
          } 
        }
    }
      
      
    /*
     * Fetch place details and execute callback
     * using the places API service
     * p - place with or without address components
     * service - places API
     * callback - after storing info, do what user wants
     */
    function  fetchPlaceAddress(p, service, callback){
        // DEBUG: checking out what types we get back..
        var s = p.name;
        for (var i in p.types) {
         s += ": " + p.types[i];
        }
        console.log(s);
        if (!p.address_components) {
          console.log("Fetching details...");
          service.getDetails({
            placeId: p.place_id
          }, function(place, status) {
              if (status === google.maps.places.PlacesServiceStatus.OK) {
                  storeAddressData(place)
                  callback(place)
              } else {
                // TODO: Warn user no address available for that option
                var place_name;
                if (!place.name) {
                    place_name = "(undefined)";
                } else {
                    place_name = place.name;
                }
                console.log("Place details not found!" + place_name)
              }
          });
        } else {
            // we already have the details we want, so go ahead
            storeAddressData(p)
            callback(p);
       }
    }
    /*
     * Returns a click event handler for use with
     * fetching place details - fetches when clicked,
     * and then fetch place calls the callback
     */
    function clickHandlerForPlace(p, service, callback){
        return function(event) {
            fetchPlaceAddress(p, service, callback);      
        }
    }
    
    /**
     * Returns JSON dict of address data.
     * Possible fields are:
     * TODO
     * args - Optional list or string corresponding
     * to the desired key value pairs
     * i.e. ["formatted_address","formatted_phone_number"]
     * if you don't want any other info
     * Otherwise the dict will have all available
     * place/address fields
     * recorded in addressData
     */
    function getAddressData(args) {
        if (args == null) {
          return addressData;
        } else {
          var d = {}; 
          if (typeof args == 'string') {
            d[args] = addressData[args];
          }
          else if (typeof args == 'list') {
            for (var i in args){
                d[i] = addressData[i];
            }
          }
          return d;
        }
    }

    function clearAddressData(){
        addressData = {};    
    }