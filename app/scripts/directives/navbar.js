'use strict';

app.directive('navbar', function ($rootScope, $state, $ionicModal) {  // other injections: , AuthService, AUTH_EVENTS, 

    return {
        restrict: 'E',
        scope: {
            home: '=',
            abandon: '=',
            nssocket: '=',
            socket: '='
        },
        templateUrl: 'templates/navbar.html',
        link: function (scope) {

            scope.openAuth = function() {
                $rootScope.$emit('openAuthModal');
            }

            // scope.items = [
            //     { label: 'Home', state: 'home' },
            //     { label: 'Map', state: 'map' },
            //     { label: 'Members Only', state: 'membersOnly', auth: true }
            // ];

            // scope.user = null;

            // scope.isLoggedIn = function () {
            //     return AuthService.isAuthenticated();
            // };

            // scope.logout = function () {
            //     AuthService.logout().then(function () {
            //        $state.go('home');
            //     });
            // };

            // var setUser = function () {
            //     AuthService.getLoggedInUser().then(function (user) {
            //         scope.user = user;
            //     });
            // };

            // var removeUser = function () {
            //     scope.user = null;
            // };

            // setUser();

            // $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            // $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            // $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);

        }

    };

});
