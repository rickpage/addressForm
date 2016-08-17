addressForm

Examples of using map widget and search box
to find place(s) to select and turn into JSON.
This pattern can be used to collect JSON data
for use with i.e. REST API calls, SaaS, etc.

---
searchbox.js
Searchbox functionality to assist in searching and
selecting a desired address for use in JSON.

Usage:


1. Write a function such as initAutocomplete that calls
function initAutocomplete(){
initializeSearchbox(
  { lat : starting_lat
  , lng : starting_lng
  , callback : fill_in_form_address_data }
 )
 ...
 }

2. call initAutocomplete from google api link i.e.
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBWNNCsmSfb0gpZv3IuK1c91cctc2y6FYY&libraries=places&amp;callback=initAutocomplete"
         async defer
3. When user searches and/or clicks an icon, the
script stores that address data and fires a callback.
The default callback is:

fillInAddress(p)

p - place data

TODO: Explain prereqs for this to work out of box
 
---

Ideas for improvement:

Abstract out the google maps API part and allow for
different geocode entry points