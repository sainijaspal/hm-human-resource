module.exports = assets => {
  // eslint-disable-next-line no-param-reassign
  assets.root = `${__dirname}/public/`;
  // assets.addJsUrl('/socket.io.js');

  // javascript third part libraries bundle for layout page header
  assets.addJs('plugins/jQuery/jquery-2.2.3.min.js', 'js-layout-header-bundle');
  assets.addJs('plugins/jQueryUI/jquery-ui.min.js', 'js-layout-header-bundle');
  assets.addJs(
    'plugins/datatables/jquery.dataTables.min.js',
    'js-layout-header-bundle',
  );
  assets.addJs(
    'plugins/datatables/dataTables.bootstrap.min.js',
    'js-layout-header-bundle',
  );
  assets.addJs('bootstrap/js/bootstrap.min.js', 'js-layout-header-bundle');

  // javascript third part libraries bundle for layout page bottom
  // section(after render page)
  assets.addJs(
    'plugins/sparkline/jquery.sparkline.min.js',
    'js-layout-bottom-section-bundle',
  );
  assets.addJs(
    'plugins/jvectormap/jquery-jvectormap-1.2.2.min.js',
    'js-layout-bottom-section-bundle',
  );
  assets.addJs(
    'plugins/jvectormap/jquery-jvectormap-world-mill-en.js',
    'js-layout-bottom-section-bundle',
  );

  // jQuery Knob Chart
  assets.addJs(
    'plugins/knob/jquery.knob.js',
    'js-layout-bottom-section-bundle',
  );

  // daterangepicker
  assets.addJs(
    'plugins/moment/moment.min.js',
    'js-layout-bottom-section-bundle',
  );
  assets.addJs(
    'plugins/daterangepicker/daterangepicker.js',
    'js-layout-bottom-section-bundle',
  );
  assets.addJs(
    'plugins/datepicker/bootstrap-datepicker.js',
    'js-layout-bottom-section-bundle',
  );
  assets.addJs(
    'plugins/bootstrap-wysihtml5/bootstrap3-wysihtml5.all.min.js',
    'js-layout-bottom-section-bundle',
  );
  assets.addJs(
    'plugins/slimScroll/jquery.slimscroll.min.js',
    'js-layout-bottom-section-bundle',
  );
  assets.addJs(
    'plugins/fastclick/fastclick.js',
    'js-layout-bottom-section-bundle',
  );

  // AdminLTE App
  assets.addJs('dist/js/app.min.js', 'js-layout-bottom-section-bundle');

  // css bundle for login page
  assets.addCss('bootstrap/css/bootstrap.min.css', 'login-page-bundle');
  assets.addCss('dist/css/AdminLTE.min.css', 'login-page-bundle');

  // css bundle for layout page
  assets.addCss('bootstrap/css/bootstrap.min.css', 'layout-bundle');
  assets.addCss('bootstrap/css/bootstrap-ui.css', 'layout-bundle');
  assets.addCss('plugins/datatables/dataTables.bootstrap.css', 'layout-bundle');
  assets.addCss('dist/css/AdminLTE.min.css', 'layout-bundle');
  assets.addCss('dist/css/skins/_all-skins.min.css', 'layout-bundle');
  assets.addCss('plugins/iCheck/flat/blue.css', 'layout-bundle');
  assets.addCss('plugins/morris/morris.css', 'layout-bundle');
  assets.addCss('plugins/morris/morris.css', 'layout-bundle');
  assets.addCss(
    'plugins/jvectormap/jquery-jvectormap-1.2.2.css',
    'layout-bundle',
  );
  assets.addCss('plugins/datepicker/datepicker3.css', 'layout-bundle');
  assets.addCss('plugins/daterangepicker/daterangepicker.css', 'layout-bundle');
  assets.addCss(
    'plugins/bootstrap-wysihtml5/bootstrap3-wysihtml5.min.css',
    'layout-bundle',
  );
};
