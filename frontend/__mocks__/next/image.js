module.exports = {
  __esModule: true,
  default: function Image({ src, alt, ...props }) {
    return Object.assign(props, {
      src,
      alt: alt || '',
    });
  },
};
