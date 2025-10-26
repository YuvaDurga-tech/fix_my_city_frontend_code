import { GoogleGenAI, Chat } from "@google/genai";

// =======================================================
// === MINIMAL PLACEHOLDER DATA (Required for your existing render functions) ===
// =======================================================
let complaintsDB = [
  {
    id: 1,
    username: "Priya S.",
    category: "Streetlight Failure",
    city: "Mumbai",
    title: "Placeholder Issue",
    details: "This is a placeholder for a civic issue.",
    location: { address: "Mumbai", lat: 19.02, lng: 72.84 },
    date: "2025-10-15",
    status: "Resolved",
  },
];
let nextComplaintId = 2;

// --- Map Variables and Functions ---
let mapReport, mapDashboard, reportMarker, geocoder;
let mapsInitialized = false;

function initMap() {
  window.mapsApiLoaded = true;
  if (window.domContentLoaded) initializeMaps();
}
window.initMap = initMap;

function initializeMaps() {
  if (mapsInitialized || typeof google === "undefined") return;
  mapsInitialized = true;
  const initialPosition = { lat: 20.5937, lng: 78.9629 };
  geocoder = new google.maps.Geocoder();

  const mapReportDiv = document.getElementById("map-report");
  if (mapReportDiv) {
    mapReport = new google.maps.Map(mapReportDiv, { center: initialPosition, zoom: 5, mapTypeControl: false, streetViewControl: false });
    reportMarker = new google.maps.Marker({ position: initialPosition, map: mapReport, draggable: true });
    reportMarker.addListener("dragend", () => { updateLocationInput(reportMarker.getPosition()); });
  }

  const mapDashboardDiv = document.getElementById("map-dashboard");
  if (mapDashboardDiv) {
    mapDashboard = new google.maps.Map(mapDashboardDiv, { center: initialPosition, zoom: 5, mapTypeControl: false });
  }
}

function updateLocationInput(latLng) {
  geocoder.geocode({ location: latLng }, (results, status) => {
    if (status === "OK" && results[0]) {
      document.getElementById("location").value = results[0].formatted_address;
    }
  });
}

// =======================================================
// === CORE FRONTEND LOGIC ===
// =======================================================
document.addEventListener("DOMContentLoaded", function () {
  window.domContentLoaded = true;
  if (window.mapsApiLoaded) initializeMaps();

  const currentUser = "Priya S.";

  const pages = document.querySelectorAll(".page");
  const navLinks = document.querySelectorAll(".nav-link");
  const ctaButtons = document.querySelectorAll(".cta-button");
  const mobileMenuButton = document.getElementById("mobile-menu-button");
  const mobileMenu = document.getElementById("mobile-menu");
  const selectCitizen = document.getElementById("select-citizen");
  const selectAdmin = document.getElementById("select-admin");

  const adminIssuesTbody = document.getElementById("admin-issues-tbody");
  const myReportsListContainer = document.getElementById("my-reports-list-container");
  const recentlyResolvedContainer = document.getElementById("recently-resolved-container");
  const citizenDashboardReportsContainer = document.getElementById("citizen-dashboard-reports-container");

  const nav = {
    myReports: [
      document.getElementById("my-reports-link-d"),
      document.getElementById("my-reports-link-m"),
    ],
    loginSignup: [
      document.getElementById("login-signup-link-d"),
      document.getElementById("login-signup-link-m"),
    ],
    logout: [
      document.getElementById("logout-link-d"),
      document.getElementById("logout-link-m"),
    ],
  };

  // =======================================================
  function navigate(pageId) {
    pages.forEach(p => p.classList.add('hidden'));
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.remove('hidden');

    navLinks.forEach(link => {
      link.classList.remove('nav-link-active');
      if (link.dataset.page === pageId) link.classList.add('nav-link-active');
    });

    const isLoggedIn = pageId === 'citizenDashboardPage' || pageId === 'adminDashboardPage';
    nav.myReports.forEach(el => el.classList.toggle('hidden', !isLoggedIn));
    nav.logout.forEach(el => el.classList.toggle('hidden', !isLoggedIn));
    nav.loginSignup.forEach(el => el.classList.toggle('hidden', isLoggedIn));

    if (pageId.includes('DashboardPage')) updateAllDashboards();
  }

  // --- Dashboard Renderers ---
  function updateAllDashboards() {
    renderAdminTable();
    renderMyReports();
    renderPublicDashboard();
    renderCitizenDashboard();
  }

  function renderAdminTable() {
    if (!adminIssuesTbody) return;
    adminIssuesTbody.innerHTML = complaintsDB.map(c =>
      `<tr class="border-b border-gray-200 hover:bg-gray-50">
        <td class="p-4">${c.title}</td>
        <td class="p-4">${c.category}</td>
        <td class="p-4">${c.date}</td>
        <td class="p-4">${c.username}</td>
        <td class="p-4">${c.city}</td>
        <td class="p-4">
          <select class="status-select" data-id="${c.id}">
            <option ${c.status === "Pending" ? "selected" : ""}>Pending</option>
            <option ${c.status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option ${c.status === "Resolved" ? "selected" : ""}>Resolved</option>
          </select>
        </td>
      </tr>`).join('');
    adminIssuesTbody.querySelectorAll(".status-select").forEach(select => {
      select.addEventListener("change", handleStatusUpdate);
    });
  }

  function renderMyReports() {
    if (!myReportsListContainer) return;
    const userReports = complaintsDB.filter(c => c.username === currentUser);
    myReportsListContainer.innerHTML = userReports.length ? userReports.map(c =>
      `<div class="report-card bg-white rounded-lg shadow-md p-5">
        <p class="font-semibold">${c.title}</p>
        <p class="text-sm text-gray-500">${c.category} - ${c.status}</p>
      </div>`).join('') : `<div class="bg-white p-5 rounded-lg shadow-md text-center text-gray-500">No reports found.</div>`;
  }

  function renderPublicDashboard() {
    if (!recentlyResolvedContainer) return;
    if (document.getElementById("total-complaints-stat")) document.getElementById("total-complaints-stat").textContent = complaintsDB.length;
    if (document.getElementById("resolved-complaints-stat")) document.getElementById("resolved-complaints-stat").textContent = complaintsDB.filter(c => c.status === "Resolved").length;
    if (document.getElementById("inprogress-complaints-stat")) document.getElementById("inprogress-complaints-stat").textContent = complaintsDB.filter(c => c.status === "In Progress").length;

    recentlyResolvedContainer.innerHTML = complaintsDB.filter(c => c.status === "Resolved").slice(0, 3).map(c =>
      `<div class="bg-white p-5 rounded-lg shadow-md"><p>${c.title}</p></div>`).join('');

    if (mapDashboard && typeof google !== "undefined") {
      const infoWindow = new google.maps.InfoWindow();
      complaintsDB.forEach(issue => {
        const marker = new google.maps.Marker({
          position: { lat: issue.location.lat, lng: issue.location.lng },
          map: mapDashboard,
          title: issue.title,
        });
        marker.addListener("click", () => {
          infoWindow.setContent(`<div><h4>${issue.title}</h4><p>Status: ${issue.status}</p></div>`);
          infoWindow.open(mapDashboard, marker);
        });
      });
    }
  }

  function renderCitizenDashboard() {
    if (!citizenDashboardReportsContainer) return;
    const userReports = complaintsDB.filter(c => c.username === currentUser);
    if (document.getElementById("citizen-total-stat")) document.getElementById("citizen-total-stat").textContent = userReports.length;
    if (document.getElementById("citizen-resolved-stat")) document.getElementById("citizen-resolved-stat").textContent = userReports.filter(c => c.status === "Resolved").length;
  }

  function handleStatusUpdate(e) {
    const complaintId = parseInt(e.target.dataset.id, 10);
    const newStatus = e.target.value;
    const complaint = complaintsDB.find(c => c.id === complaintId);
    if (complaint) {
      complaint.status = newStatus;
      updateAllDashboards();
    }
  }

  // --- Chatbot ---
  const chatbotForm = document.getElementById("chatbot-form");
  const chatbotInput = document.getElementById("chatbot-input");
  const chatbotMessages = document.getElementById("chatbot-messages");
  const chatbotToggle = document.getElementById("chatbot-toggle");
  const chatbotWindow = document.getElementById("chatbot-window");
  const closeChatbot = document.getElementById("close-chatbot");

  let ai, chat;
  function initializeChat() { /* Initialize AI here */ }
  function addChatMessage(message, sender) { /* Render chat messages */ }

  if (chatbotForm) chatbotForm.addEventListener("submit", async (e) => { e.preventDefault(); });
  if (chatbotToggle) chatbotToggle.addEventListener("click", () => {
    chatbotWindow.classList.toggle("hidden");
    if (!chatbotWindow.classList.contains("hidden")) initializeChat();
  });
  if (closeChatbot) closeChatbot.addEventListener("click", () => chatbotWindow.classList.add("hidden"));

  // --- Navigation Event Listeners ---
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = link.dataset.page;
      if (pageId) navigate(pageId);
      if (mobileMenu && !mobileMenu.classList.contains('hidden')) mobileMenu.classList.add('hidden');
    });
  });

  ctaButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const pageId = button.dataset.page;
      if (pageId) navigate(pageId);
    });
  });

  if (selectCitizen) selectCitizen.addEventListener('click', () => navigate('loginSignupPage'));
  if (selectAdmin) selectAdmin.addEventListener('click', () => navigate('adminDashboardPage'));
  if (mobileMenuButton) mobileMenuButton.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
  nav.logout.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); navigate('roleSelectionPage'); }));

  // --- FINAL INIT ---
  updateAllDashboards();
});
