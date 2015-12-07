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
            startedquests: '=',
            transitionstate: '='
        },
        templateUrl: 'templates/navbar.html',
        link: function (scope) {

            scope.openAuth = function() {
                $rootScope.$emit('openAuthModal');
            }

            $rootScope.$on('auth-login-success', function() {
                scope.user = Session.user;
            })

            $rootScope.$on('auth-logout-success-', function(){
                scope.user = false;
            })

            scope.logout = function() {
                AuthService.logout().then(function(){
                    $rootScope.$broadcast('logout');
                });
            } ;

        }

    };

});
