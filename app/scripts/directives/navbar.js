'use strict';

app.directive('navbar', function ($rootScope, $state, ClickFactory, $timeout, $ionicModal, AuthService, Session, SocketFactory) {  // other injections: , AuthService, AUTH_EVENTS, 

    return {
        transclude: true,
        restrict: 'E',
        scope: {
            home: '=',
            nssocket: '=',
            socket: '=',
            user: '=',
            startedquests: '='
        },
        templateUrl: 'templates/navbar.html',
        link: function (scope) {

            $('button').click(function() {
              var theButton = $(this);
              ClickFactory.buttonReact(theButton);
            });

            scope.abandon = SocketFactory.abandon;

            scope.openAuth = function() {
                $rootScope.$emit('openAuthModal');
            };

            $rootScope.$on('auth-login-success', function() {
                scope.user = Session.user;
            });

            $rootScope.$on('auth-logout-success-', function(){
                scope.user = false;
            });

            scope.logout = function() {
                AuthService.logout().then(function(){
                    $rootScope.$broadcast('logout');
                });
            } ;

        }

    };

});
