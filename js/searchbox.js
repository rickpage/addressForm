/*
 * Searchbox functionality
 * Usage:
 * call initAutocomplete from google api link i.e.
 * <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBWNNCsmSfb0gpZv3IuK1c91cctc2y6FYY&libraries=places&amp;callback=initAutocomplete"
         async defer></script>
 * Pre-requisites:
 *          
        </pre>
        <form id="theForm" onsubmit="return false;">
 * TODO
 */
function initAutocomplete() {
        var map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: -33.8688, lng: 151.2195},
          zoom: 13,
          mapTypeId: 'roadmap'
          , types: 'establishment'
        });

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
            fetchPlaceAddress(places[0], service, fillInAddress);
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
                marker.addListener('click', clickHandlerForPlace(p, service, fillInAddress));
                
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

      /*
       * Take place details and fill in the form
       * elements with the values
       */
      function fillInAddress(place,status) {
        // These correspond to element ids in the form
        var componentForm = {
            street_number: 'short_name',
            route: 'long_name',
            locality: 'long_name',
            administrative_area_level_1: 'short_name',
            administrative_area_level_2: 'short_name',
            // country: 'long_name',
            postal_code: 'short_name',
          };
        // Get the place details from the autocomplete object.
        // var place = autocomplete.getPlace();
        for (var component in componentForm) {
          document.getElementById(component).value = '';
          document.getElementById(component).disabled = false;
        }

        // Get each component of the address from the place details
        // and fill the corresponding field on the form.
        for (var i = 0; i < place.address_components.length; i++) {
          
          // LOG  
          console.log(place.address_components[i].types[0] + " = "
                        + place.address_components[i]["short_name"]);
          // addressType here corresponds to the keys in componentForm
          var addressType = place.address_components[i].types[0];
          if (componentForm[addressType]) {
            var val = place.address_components[i][componentForm[addressType]];
            // TODO: Either include in prereqs, or find children of #theForm properly
            var elem = document.getElementById(addressType);
            // if we can find the id in the form, set its value
            if (typeof elem != 'undefined'){
                elem.value = val;
            } else {
                console.log("no id in the document for " + addressType);
            }
          }
        }
        // formatted address
        var formatted = place.formatted_address;
        var elem = document.getElementById("formatted_address");
        if (typeof elem != 'undefined') {
            elem.value = formatted;
        }
        // phone
        var phone = place.formatted_phone_number;
        elem = document.getElementById("formatted_phone_number");
        if (typeof elem != 'undefined') {
            elem.value = phone;
        }
        
        // GPS lat lon
        var lat, lng;
        lat = place.geometry.location.lat();
        lng = place.geometry.location.lng();

        document.getElementById("location_lat").value = lat;
        document.getElementById("location_lat").disabled = true;
        document.getElementById("location_lng").value = lng;
        document.getElementById("location_lng").disabled = true;
        var j = $("#theForm").serialize()

        console.log(j);
        
    }
      
      
    /*
     * Fetch place details and execute callback
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
            callback(p);
       }
    }
    /*
     * Returns a click event handler for use with
     * fetching place details
     */
    function clickHandlerForPlace(p, service, callback){
        return function(event) {
            fetchPlaceAddress(p, service, callback);      
        }
    }