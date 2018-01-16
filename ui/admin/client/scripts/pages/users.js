'use strict';

var fs = require('fs');

var template = fs.readFileSync(__dirname + '/users.html', 'utf8');
var searchConfig = JSON.parse(fs.readFileSync(__dirname + '/users-search-plugin-config.json', 'utf8'));

var angular = require('camunda-commons-ui/vendor/angular');

var Controller = ['$scope', '$location', 'search', 'UserResource', 'page', '$translate', function($scope, $location, search, UserResource, pageService, $translate) {
  $scope.searchConfig = angular.copy(searchConfig);

  angular.forEach(searchConfig.tooltips, function(translation, tooltip) {
    $scope.searchConfig.tooltips[tooltip] = $translate.instant(translation);
  });

  $scope.searchConfig.types.map(function(type) {
    type.id.value = $translate.instant(type.id.value);
    if (type.operators) {
      type.operators = type.operators.map(function(op) {
        op.value = $translate.instant(op.value);
        return op;
      });
    }
    return type;
  });

  $scope.blocked = true;
  $scope.onSearchChange = updateView;

  $scope.query = $scope.pages = null;
  var sorting;

  $scope.onSortInitialized = function(_sorting) {
    sorting = _sorting;
    $scope.blocked = false;
  };

  $scope.onSortChanged = function(_sorting) {
    sorting = _sorting;
    updateView();
  };

  function updateView(query, pages) {
    if (query && pages) {
      $scope.query = query;
      $scope.pages = pages;
    }

    var page = $scope.pages.current,
        count = $scope.pages.size,
        firstResult = (page - 1) * count;

    var queryParams = {
      firstResult: firstResult,
      maxResults: count,
      sortBy: sorting.sortBy,
      sortOrder: sorting.sortOrder
    };

    $scope.userList = null;
    $scope.loadingState = 'LOADING';

    return UserResource.count(angular.extend({}, $scope.query)).$promise.then(function(data) {
      var total = data.count;

      return UserResource.query(angular.extend({}, $scope.query, queryParams)).$promise.then(function(data) {
        $scope.userList = data;
        $scope.loadingState = data.length ? 'LOADED' : 'EMPTY';

        return total;
      });
    });
  }

  $scope.availableOperations = {};
  UserResource.OPTIONS().$promise.then(function(response) {
    angular.forEach(response.links, function(link) {
      $scope.availableOperations[link.rel] = true;
    });
  });

  $scope.$root.showBreadcrumbs = true;

  pageService.titleSet($translate.instant('USERS_USERS'));

  pageService.breadcrumbsClear();

  pageService.breadcrumbsAdd({
    label: $translate.instant('USERS_USERS'),
    href: '#/users/'
  });
}];

module.exports = [ '$routeProvider', function($routeProvider) {
  $routeProvider.when('/users', {
    template: template,
    controller: Controller,
    authentication: 'required',
    reloadOnSearch: false
  });
}];
