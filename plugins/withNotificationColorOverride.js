const { withAndroidManifest } = require("@expo/config-plugins");

const META_DATA_KEY = "com.google.firebase.messaging.default_notification_color";
const MANIFEST_NAMESPACE = "http://schemas.android.com/tools";

const ensureNamespace = (manifest) => {
  const manifestRoot = manifest.manifest;
  manifestRoot.$ = manifestRoot.$ || {};
  if (!manifestRoot.$["xmlns:tools"]) {
    manifestRoot.$["xmlns:tools"] = MANIFEST_NAMESPACE;
  }
};

const upsertMetaData = (application) => {
  application["meta-data"] = application["meta-data"] || [];

  const existing = application["meta-data"].find(
    (item) => item.$?.["android:name"] === META_DATA_KEY
  );

  const metaDataAttributes = {
    "android:name": META_DATA_KEY,
    "android:resource": "@color/notification_icon_color",
    "tools:replace": "android:resource",
  };

  if (existing) {
    existing.$ = {
      ...existing.$,
      ...metaDataAttributes,
    };
  } else {
    application["meta-data"].push({
      $: metaDataAttributes,
    });
  }
};

const withNotificationColorOverride = (config) =>
  withAndroidManifest(config, (config) => {
    const { modResults } = config;
    ensureNamespace(modResults);

    const application = modResults.manifest.application?.[0];
    if (!application) {
      return config;
    }

    upsertMetaData(application);

    return config;
  });

module.exports = withNotificationColorOverride;

