export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyDLdpREQ1AaLWrKzEDxOaKgyKVHQTHYUzY",
    authDomain: "todo-list-692b5.firebaseapp.com",
    projectId: "todo-list-692b5",
    storageBucket: "todo-list-692b5.firebasestorage.app",
    messagingSenderId: "684741818450",
    appId: "1:684741818450:web:ba8fae05d76539e501078b"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
</script>
