module.exports = {
  plugins: [
    //  plugin to parse CSS and add vendor prefixes to CSS rules using values from Can I Use.
    require('autoprefixer')({
      // use Browserlist to target specific browsers to add CSS support
      'browsers': ['> 1%', 'not dead', 'last 1 versions', 'maintained node versions']
    })
  ]
};