// app.js
import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";

import { 
  getFirestore, collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

import { 
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// ----- Firebase Config -----
const firebaseConfig = {
  apiKey: "AIzaSyDP7TSGwJs_iIvWQ71F_WlWpr9Sqwn_78Q",
  authDomain: "pharmacy-dashboard-d496a.firebaseapp.com",
  projectId: "pharmacy-dashboard-d496a",
  storageBucket: "pharmacy-dashboard-d496a.firebasestorage.app",
  messagingSenderId: "144808325961",
  appId: "1:144808325961:web:044d29d644c2462b8be098",
  measurementId: "G-M3ZFT1CY63"
};

// ----- Initialize Firebase -----
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ----- DOM Elements -----
const loginForm = document.getElementById("login-form");
const dashboard = document.getElementById("dashboard");
const logoutBtn = document.getElementById("logout-btn");

// ----- Authentication -----
// Check auth state
onAuthStateChanged(auth, user => {
  if(user){
    dashboard.style.display = "block";       // show dashboard
    loginForm.style.display = "none";        // hide login form
    updateDashboard();
  } else {
    dashboard.style.display = "none";        // hide dashboard
    loginForm.style.display = "block";       // show login form
  }
});

// Login
loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    alert("Login failed: " + err.message);
  }
});

// Logout
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  alert("Logged out!");
});

// ----- Pharmacy Dashboard Code -----
const drugForm = document.getElementById("drug-form");
const saleForm = document.getElementById("sales-form");
const stockTable = document.querySelector("#stock-table tbody");
const saleSelect = document.getElementById("sale-drug");
const restockTable = document.querySelector("#restock-table tbody");
const expiryTable = document.querySelector("#expiry-table tbody");
const totalSalesSpan = document.getElementById("total-sales");
const totalRevenueSpan = document.getElementById("total-revenue");
const searchInput = document.getElementById("search-category");

// Add / Restock Drug
drugForm.addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("drug-name").value.trim();
  const stock = parseFloat(document.getElementById("drug-stock").value);
  const restockThreshold = parseFloat(document.getElementById("restock-threshold").value);
  const price = parseFloat(document.getElementById("drug-price").value);
  const expiry = document.getElementById("drug-expiry").value;
  const supplier = document.getElementById("drug-supplier").value.trim();
  const category = document.getElementById("drug-category").value.trim();

  if(!category){
    alert("Please enter a category.");
    return;
  }

  const q = query(collection(db, "drugs"), where("name", "==", name));
  const snapshot = await getDocs(q);

  if(snapshot.empty){
    await addDoc(collection(db, "drugs"), {name, stock, restockThreshold, price, expiry, supplier, category});
  } else {
    snapshot.forEach(async docSnap => {
      await updateDoc(doc(db, "drugs", docSnap.id), {
        stock: docSnap.data().stock + stock,
        price, expiry, supplier, category
      });
    });
  }
  e.target.reset();
  updateDashboard();
});

// Record Sale
saleForm.addEventListener("submit", async e => {
  e.preventDefault();
  const drugId = document.getElementById("sale-drug").value;
  const quantity = parseFloat(document.getElementById("sale-quantity").value);
  const drugRef = doc(db, "drugs", drugId);
  const drugDoc = await getDoc(drugRef);

  if(drugDoc.exists() && drugDoc.data().stock >= quantity){
    const totalPrice = quantity * drugDoc.data().price;
    await addDoc(collection(db, "sales"), {
      drugId, quantity, totalPrice,
      date: new Date().toISOString().split("T")[0]
    });
    await updateDoc(drugRef, {stock: drugDoc.data().stock - quantity});
    updateDashboard();
  } else {
    alert("Not enough stock!");
  }
  e.target.reset();
});

// Dashboard update function
async function updateDashboard(){
  stockTable.innerHTML = "";
  saleSelect.innerHTML = "";
  restockTable.innerHTML = "";
  expiryTable.innerHTML = "";

  const now = new Date();
  let totalSales = 0;
  let totalRevenue = 0;

  const filter = searchInput.value.trim().toLowerCase();
  const drugsSnapshot = await getDocs(collection(db, "drugs"));
  const drugsIds = [];

  drugsSnapshot.forEach(docSnap => {
    const data = docSnap.data();
    drugsIds.push(docSnap.id);

    const expiryDate = new Date(data.expiry);
    const diffDays = Math.ceil((expiryDate-now)/(1000*60*60*24));

    if(!filter || data.category.toLowerCase().includes(filter)){
      const tr = document.createElement("tr");
      if(data.stock <= data.restockThreshold) tr.classList.add("low-stock");
      if(diffDays <= 30) tr.classList.add("near-expiry");
      tr.innerHTML = `<td>${data.name}</td>
                      <td>${data.stock}</td>
                      <td>${data.restockThreshold}</td>
                      <td>Ksh ${data.price.toFixed(2)}</td>
                      <td>${data.expiry}</td>
                      <td>${data.supplier}</td>
                      <td>${data.category}</td>
                      <td><button class="delete-btn">Delete</button></td>`;
      stockTable.appendChild(tr);

      tr.querySelector(".delete-btn").addEventListener("click", async () => {
        const confirmDelete = confirm(`Delete ${data.name}?`);
        if(confirmDelete){
          await deleteDoc(doc(db, "drugs", docSnap.id));
          const salesQuery = query(collection(db, "sales"), where("drugId","==",docSnap.id));
          const salesSnapshot = await getDocs(salesQuery);
          salesSnapshot.forEach(async saleDoc => await deleteDoc(doc(db,"sales",saleDoc.id)));
          updateDashboard();
        }
      });
    }

    const option = document.createElement("option");
    option.value = docSnap.id;
    option.textContent = `${data.name} (Stock: ${data.stock})`;
    saleSelect.append(option);

    if(data.stock <= data.restockThreshold){
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${data.name}</td><td>${data.stock}</td><td>${data.restockThreshold}</td>`;
      restockTable.appendChild(tr);
    }

    if(diffDays <= 30){
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${data.name}</td><td>${data.expiry}</td><td>${diffDays}</td>`;
      expiryTable.appendChild(tr);
    }
  });

  const salesSnapshot = await getDocs(collection(db, "sales"));
  salesSnapshot.forEach(docSnap => {
    const sale = docSnap.data();
    if(drugsIds.includes(sale.drugId)){
      totalSales += sale.quantity;
      totalRevenue += sale.totalPrice;
    }
  });
  totalSalesSpan.textContent = totalSales;
  totalRevenueSpan.textContent = `Ksh ${totalRevenue.toFixed(2)}`;
}

searchInput.addEventListener("input", updateDashboard);