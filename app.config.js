// Everything lives in app.json; this file only adds settings that come from
// the build environment, so they don't have to be committed.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    // google-services.json (Firebase) is kept out of git. On EAS Build it comes
    // from the GOOGLE_SERVICES_JSON file variable; locally, the file next to this one.
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
  },
});
