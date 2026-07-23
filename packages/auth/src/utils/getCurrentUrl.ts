const getCurrentUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.href.replace(/#.*$/, '');
};

export default getCurrentUrl;
