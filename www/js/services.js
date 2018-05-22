angular.module('songhop.services', ['ionic.utils'])

.factory('User', function($http, SERVER, $q, $localstorage) {
	var o = {
		favorites:[],
		newFavorites: 0,
		username: false,
		session_id: false
	}

	o.auth = function(username, signingUp) {

		var authRoute;

		if (signingUp) {
			authRoute = 'signup';
		} else {
			authRoute='login'
		}
		return $http.post(SERVER.url + '/' + authRoute, 
			{username: username}).success(function(data){
				o.setSession(data.username, data.session_id, 
					data.favorites)
			});
		}

		o.addSongToFavorites = function(song) {
			//we sure available song to add
			
			if(!song) return false;

			// add to fav array
			o.favorites.unshift(song);
			o.newFavorites++;

			//insisting this to server
			return $http.post(SERVER.url + '/favorites', {session_id: 
				o.session_id, song_id: song.song_id});
		}

		o.removeSongFromFavorites = function(song, index) {
			//ensure we have song to add
			if (!song) return false;

			//add to fav array
			o.favorites.splice(index, 1);

			//persist this for server
			return $http({
				method: 'DELETE',
				url: SERVER.url + '/favorites',
				params: {session_id: o.session_id, song_id: song.song_id}
			});
		}

		o.favoriteCount = function () {
			return o.newFavorites;
		}

		//gets entire list of person favs from server
		o.populateFavorites = function () {
			return $http({
				method: 'GET',
				url: SERVER.url +'/favorites',
				params: {session_id: o.session_id}
			}).success(function(data){
				//merge data into queue
				o.favorites = data;
			});
		}

		o.setSession = function( username, session_id, favorites) {
			if(username) o.username = username;
			if(session_id) o.session_id= session_id;
			if(favorites) o.favorites = favorites;

			//put data in localstorage obj
			$localstorage.setObject ('user', {username: username, 
				session_id:session_id });
		}

		o.checkSession = function() {
			var defer = $q.defer();

			if (o.session_id) {
				//when sess already initiated in serv
				defer.resolve(true);
			} else {
				//detect if sess exists in localstorage from previous time
				//if this is case then pull in service
				var user = $localstorage.getObject('user');

				if (user.username) {
					//if user there, then grab credentials
					o.setSession(user.username, user.session_id);
					o.populateFavorites().then(function() {
						defer.resolve(true);
					});

				} else {
					//none info in localstorage, reject promise
					defer.resolve(false);
				}
			}
			return defer.promise
		}
		
		//eliminate all sess data
		o.destroySession = function() {
			$localstorage.setObject('user', {});
			o.username = false;
			o.session_id =false;
			o.favorites=[];
			o.newFavorites= 0;
		}
		return o;
	})

.factory('Recommendations', function($http, SERVER, $q){
	
	var o = {
		queue : []
	};
	var media;

	o.init = function ( ) {
		if(o.queue.length === 0 ) {
// if nothing in queue, lets put smth there
// therefore we call here init 

return o.getNextSongs();
}
else {
	//else play curr song
	return o.playCurrentSong();
}
}


o.getNextSongs = function () {
	return $http({
		method: 'GET',
		url:SERVER.url +'/recommendations'
	}).success(function(data){
//merge data into queue
o.queue = o.queue.concat(data);

})
}

o.nextSong = function() {
		//pop index 0 out
		o.queue.shift();

		//end playing
		o.haltAudio();

//low on songs? lets add more
if(o.queue.length < 5) {
	o.getNextSongs();
}
}

o.playCurrentSong = function() {
	var defer = $q.defer ();

	//play 30 sec prev

	media = new Audio(o.queue[0].preview_url);

//if song loads, solve promise to let controller understand

media.addEventListener("loadeddata", function () {
	defer.resolve();
})

media.play();

return defer.promise;

}
//just while switch to fav tab
o.haltAudio = function() {
	if (media) media.pause();
}

return o;
})


