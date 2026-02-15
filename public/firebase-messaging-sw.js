/* eslint-disable no-undef */
importScripts(
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyC4zVXd_WFd-iNAsVWttovw4bnGt5x0yY8",
  authDomain: "moodlog-6297c.firebaseapp.com",
  projectId: "moodlog-6297c",
  storageBucket: "moodlog-6297c.firebasestorage.app",
  messagingSenderId: "308519914538",
  appId: "1:308519914538:web:849b6129b5863ca55ac753",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "MoodLog";
  const options = {
    body: payload.notification?.body || "今日の気分を記録しましょう",
    icon: "/favicon.ico",
  };
  self.registration.showNotification(title, options);
});
