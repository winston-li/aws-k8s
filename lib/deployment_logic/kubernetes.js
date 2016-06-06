var _ = require('underscore');
_.mixin(require('underscore.string').exports());

var util = require('../util.js');
var cloud_config = require('../cloud_config.js');


exports.create_master_cloud_config = function (conf) {
  var input_file = './cloud_config_templates/kubernetes-cluster-master-node-template.yaml';
  var output_file = util.join_output_file_path(conf.resources.cluster_name, 'master_node.yaml');
  var settings = conf.kubernetes;

  var write_files_pem = cloud_config.write_sensitive_files_from(['credentials', conf.resources.cluster_name, 'master'].join('/'), '/etc/kubernetes/ssl');
  var write_files_auth = cloud_config.write_sensitive_files_from('auth', '/etc/kubernetes/auth');
  var write_files_manifests = cloud_config.write_files_from('manifests', '/etc/kubernetes/manifests', settings);
  var write_files_addons = cloud_config.write_files_from('addons', '/etc/kubernetes/addons', settings);
  return cloud_config.process_template(input_file, output_file, function(data) {
    data.hostname = conf.resources.master_hostname;
    data = JSON.parse(_.template(JSON.stringify(data))(settings)); // substitude template variables
    data.write_files = data.write_files.concat(write_files_pem, write_files_auth, write_files_manifests, write_files_addons); // append additional "write_files""
    return data;
  });
};

exports.create_node_cloud_config = function (conf) {
  var input_file = './cloud_config_templates/kubernetes-cluster-worker-node-template.yaml';
  var output_file = util.join_output_file_path(conf.resources.cluster_name, 'worker_node.yaml');
  var settings = conf.kubernetes;

  var write_files_pem = cloud_config.write_sensitive_files_from(['credentials', conf.resources.cluster_name, 'worker'].join('/'), '/etc/kubernetes/ssl');
  return cloud_config.process_template(input_file, output_file, function(data) {
    data = JSON.parse(_.template(JSON.stringify(data))(settings)); // substitude template variables
    data.write_files = data.write_files.concat(write_files_pem); // append additional "write_files"
    return data;
  });
};
