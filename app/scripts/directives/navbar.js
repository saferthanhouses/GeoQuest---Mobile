'use strict';

app.directive('navbar', function ($rootScope, $state, $ionicModal, AuthService, Session) {  // other injections: , AuthService, AUTH_EVENTS, 

    return {
        transclude: true,
        restrict: 'E',
        scope: {
            home: '=',
            abandon: '=',
            nssocket: '=',
            socket: '=',
            user: '=',
            startedquests: '='
        },
        templateUrl: 'templates/navbar.html',
        link: function (scope) {

            scope.openAuth = function() {
                console.log(Session.user);
                $rootScope.$emit('openAuthModal');
            }

            $rootScope.$on('auth-login-success', function() {
                scope.user = Session.user;
            })

            $rootScope.$on('auth-logout-success-', function(){
                scope.user = false;
            })

            scope.logout = function() {
                $state.go('Home', {}, {reload:true});
                console.log(Session.user);
                AuthService.logout().then(function(){
                    // flash logout successful
                    console.log("logout successful");
                })
            } 

        }

    };

});
