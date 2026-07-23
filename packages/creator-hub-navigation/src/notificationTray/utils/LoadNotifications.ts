enum LoadNotificationsType {
  Refresh = 'refresh', // load 'fresh' notifications from top (notifs are ordered in reverse chronological order)
  Paginate = 'paginate', // load more notifs from bottom
  ReloadAll = 'reloadAll', // load entire notifications list, replacing entire list if any
}

export default LoadNotificationsType;
