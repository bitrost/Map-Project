var map;
var markers = [];

// A list of locations to populate the map
var places = [
  {title: "National Museum of Scotland", position: {lat: 55.9473069, lng: -3.189566300000024}},
  {title: "Royal Botanical Gardens", position: {lat: 55.96525269999999, lng: -3.209230899999966}},
  {title: "Edinburgh Castle", position: {lat: 55.9485947, lng: -3.1999134999999796}},
  {title: "Holyrood Palace", position: {lat: 55.9527138, lng: -3.172272399999997}},
  {title: "National Gallery of Scotland", position: {lat: 55.95090199999999, lng: -3.1956861999999546}},
  {title: "National Monument of Scotland", position: {lat: 55.954728, lng: -3.181829}}
];

// Create a new map
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 55.95497547963097, lng: -3.184010126953132},
    zoom: 12
  });

  ko.applyBindings(new ViewModel());
}

var ViewModel = function() {
  var self = this;

  self.userSearch = ko.observable('');
  self.articleSection = ko.observableArray();
  self.places = ko.observableArray(places);
  self.placesChosen = ko.observableArray();
  self.articlesListed = ko.observableArray();

  var largeInfoWindow = new google.maps.InfoWindow();

  // Logs current contents of user input to search box to console
  self.writeToConsole = ko.computed(function() {
    console.log(self.userSearch());
  });

  // Populates the map with markers - all or number filtered
  self.populateMap = ko.computed(function() {
    var searchQuery = self.userSearch().toLowerCase();
    var filteredPlaces = [];

    if (!searchQuery) {
      return fullyPopulateMap();
    } else {
      console.log("attempt to repopulate map");
      deleteMarkers();
      populateFilteredMap(searchQuery);
    }
  });

  // Manages the text list of current locations on the map
  self.selectPlaces = ko.computed(function() {
    var searchQuery = self.userSearch().toLowerCase();

    if (!searchQuery) {
      return self.places();
    } else {
      console.log("selectPlaces reached else");
      self.placesChosen([]);
      self.places().forEach(function(place) {
          var title = place.title.toLowerCase();

          if (title.indexOf(searchQuery) !== -1) {
            self.placesChosen.push(place);
          }
      })
      return self.placesChosen();
    }
  });

  // Adds content to the info window when a marker is clicked.
  // Only one info window can be open at a time.
  function populateInfoWindow(marker, infoWindow) {
    if (infoWindow.marker != marker) {
      infoWindow.marker = marker;

      infoWindow.setContent('<div>' + marker.title + '</div>');
      infoWindow.open(map, marker);
      infoWindow.marker.setAnimation(google.maps.Animation.BOUNCE);

      infoWindow.addListener('closeclick', function() {
        marker.setAnimation(null);
        infoWindow.marker = null;
      });
    }
  }

  // Adds a marker for every place on the map
  function fullyPopulateMap() {
    self.places().forEach(function(place) {
      var title = place.title;
      var position = place.position;

      // Create a marker (for each)
      var marker = new google.maps.Marker({
        map: map,
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        id: place
      });

      // Add each marker to the marker array then add a listener
      markers.push(marker);

      marker.addListener('click', function() {
        getNYTArticles(title);
        populateInfoWindow(this, largeInfoWindow);
      });

      place.marker = marker;
    })
  }

  // Sorts places that match search query into new array
  function populateFilteredMap(searchQuery) {
    self.places().forEach(function(place) {
        var title = place.title;
        var titleToSearch = place.title.toLowerCase();
        var position = place.position;

        if (titleToSearch.indexOf(searchQuery) !== -1) {
          // Create a marker
          var marker = new google.maps.Marker({
            map: map,
            position: position,
            title: title,
            animation: google.maps.Animation.DROP,
            id: place
          });

          // Add each marker to the marker array then add a listener
          markers.push(marker);

          marker.addListener('click', function() {
            getNYTArticles(title);
            populateInfoWindow(this, largeInfoWindow);
          });

          place.marker = marker;
        }
    })
  }

  // Handles opening marker when list item clicked
  self.listItemClicked = function(data) {
    populateInfoWindow(data.marker, largeInfoWindow);
    getNYTArticles(data.title);
    console.log(data);
  }

  // Functions for deleting all markers from the map

  // Sets the map on all markers in the array.
    function setMapOnAll(map) {
      for (var i = 0; i < markers.length; i++) {
        markers[i].setMap(map);
      }
    }
  // Deletes all markers in the array by removing references to them.
    function deleteMarkers() {
      setMapOnAll(null);
      markers = [];
    }

    // NYT API functions

    // Returns observable array updated with articles getNYTArticles gathers
    self.selectArticles = ko.computed(function() {
      return self.articlesListed();
    });

    //Gets NYT articles using API
    function getNYTArticles(title) {
      var articleList = self.articleSection;

      var nytimesUrl = 'http://api.nytimes.com/svc/search/v2/articlesearch.json?q='
      +title+'&sort=newest&api-key=cbfb6d058f804c20994120fb68c3d80b';

      console.log(nytimesUrl);

      // Ajax call to retrieve and generate list of articles related to a location
      $.ajax({
        url: nytimesUrl,
        method: 'GET',
      }).done(function(result) {
        articles = result.response.docs;
        for (var i=0; i < articles.length; i++) {
          var article = articles[i];
          console.log('logging article:' + article.headline.main);
          self.articlesListed.push('<a href="'+article.web_url+'">'+article.headline.main+'</a>');
        }
        console.log(result);
      }).fail(function(err) {
        alert("Error: Could not retrieve New York Times news data");
        throw err;
      });
    }
};

var mapsError = function() {
  alert("Google Maps failed to load");
}


// initMap();
// ko.applyBindings(new ViewModel());
