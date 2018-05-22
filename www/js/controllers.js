angular.module('songhop.controllers', ['ionic', 'songhop.services'])

/*
Controller for the discover page
*/

.controller('DiscoverCtrl', function($scope,$ionicLoading, $timeout, 
    User, Recommendations) {

Recommendations.init()
.then(function(){
    $scope.currentSong = Recommendations.queue[0];
   return Recommendations.playCurrentSong();
})
.then(function() {
    //close loading
    hideLoading();
    $scope.currentSong.loaded = true;
});


// fired when we favorite / skip a song
$scope.sendFeedback = function(bool){

    //first, add to fav if they favd
   if (bool) {
    User.addSongToFavorites ($scope.currentSong)};


	//set var for correct anim seq
	$scope.currentSong.rated = bool;
	$scope.currentSong.hide =true;

    //prepare next song
    Recommendations.nextSong();


    $timeout(function() {
//this allows anim to complete before change next song
	//actualize current song in scope
	$scope.currentSong = Recommendations.queue[0];
    $scope.currentSong.loaded=false;
}, 250);

    Recommendations.playCurrentSong().then(function() {
        $scope.currentSong.loaded =true;
    });
};

$scope.nextAlbumImg = function() {
    if (Recommendations.queue.length > 1 ) {
        return Recommendations.queue[1].image_large;
    }
    return '';
};

//helper funcs for loading
var showLoading = function() {
    $ionicLoading.show({
        template: '<i class = "ion-loading-c"> </i>',
        noBackdrop:true
    })
}

var hideLoading = function() {
    $ionicLoading.hide();
}

//by default set loading as true while retrieving songs from server
showLoading();

})


/*
Controller for the favorites page
*/
.controller('FavoritesCtrl', function($scope, User, $window) {
	//get fav list from user service
	$scope.favorites = User.favorites;

    $scope.removeSong = function(song, index) {
        User.removeSongFromFavorites (song, index);
    };
    $scope.openSong = function(song) {
        $window.open(song.open_url, "_system");
    }
    $scope.username =User.username;

})


/*
Controller for our tab bar
*/
.controller('TabsCtrl', function($scope, Recommendations, User, $window) {

    //stop song when going to fav page
    $scope.enteringFavorites = function() {
        User.newFavorites = 0;
        Recommendations.haltAudio();
    }

    $scope.leavingFavorites= function() {
        Recommendations.init();
    }

    $scope.logout = function() {
        User.destroySession();

        //instead of $state.go, we redirect
        //why? we have to ensure views not cached

        $window.location.href = 'index.html';
    }

    $scope.favCount = User.favoriteCount;

})

//controller for splash state
.controller('SplashCtrl', function($scope, $state, User) {
    // try to signup/login via User.auth
    $scope.submitForm = function(username, signingup) {
        User.auth(username, signingup).then(function() {
            //sess now set, now redirecting to discover
            $state.go('tab.discover');
        }, function() {
            //error management in this spot
            alert('Mmm... better other username.')
        })
    }


})


