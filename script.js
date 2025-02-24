// Global variables
let generatedImages = []; // Array to store original "/i/" image URLs (unique)
let currentImageIndex = -1; // Current index for popup carousel
const batchSize = 20; // Number of images to load per batch

// For user authentication
let currentUser = null; // Holds the username of the logged-in user
// User data will be stored in localStorage under key "user_<username>"
// Format: { password: "...", favorites: [ ... ] }

// Base image URLs – add more as needed
const baseLinks = [
  "https://i.imx.to/i/2025/02/10/5x0999.jpg",
  "https://i.imx.to/i/2025/02/22/5y8s3x.jpg"
];

// Allowed characters for random string (a-z and 0-9)
const allowedChars = "abcdefghijklmnopqrstuvwxyz0123456789";

// Function to generate a random string of given length
function generateRandomString(length) {
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * allowedChars.length);
    result += allowedChars[randomIndex];
  }
  return result;
}

// Function to modify a URL by removing last 3 characters before ".jpg" and appending 3 random characters
function modifyLink(link) {
  const jpgIndex = link.lastIndexOf(".jpg");
  if (jpgIndex === -1) return link;
  const basePart = link.substring(0, jpgIndex);
  const newBase = basePart.slice(0, -3); // Remove last 3 characters
  const randomSuffix = generateRandomString(3);
  return newBase + randomSuffix + ".jpg";
}

// Function to create and append a batch of images to the grid
function loadNextBatch() {
  const imagesGrid = document.getElementById("imagesGrid");
  for (let i = 0; i < batchSize; i++) {
    // Select a random base link and modify it
    const randomBase = baseLinks[Math.floor(Math.random() * baseLinks.length)];
    const originalLink = modifyLink(randomBase);
    // Create display URL by replacing "/i/" with "/t/"
    const displayLink = originalLink.replace("/i/", "/t/");
    
    // Create container div for image and favorite button
    const imgContainer = document.createElement("div");
    imgContainer.className = "image-container";
    
    // Create image element
    const img = document.createElement("img");
    img.src = displayLink;
    img.alt = "Generated Image";
    img.dataset.display = displayLink;
    img.dataset.original = originalLink;
    
    // Hover event: after 2 seconds switch to original, revert on mouseleave
    let hoverTimeout;
    img.addEventListener("mouseenter", () => {
      hoverTimeout = setTimeout(() => {
        img.src = img.dataset.original;
      }, 2000);
    });
    img.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimeout);
      img.src = img.dataset.display;
    });
    
    // Click event: open popup with the image
    img.addEventListener("click", () => {
      currentImageIndex = generatedImages.indexOf(img.dataset.original);
      openPopup(currentImageIndex);
    });
    
    // Create favorite heart icon overlay
    const favBtn = document.createElement("span");
    favBtn.className = "favorite-btn";
    favBtn.innerHTML = "&#9829;"; // heart symbol
    favBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(img.dataset.original, favBtn);
    });
    
    imgContainer.appendChild(img);
    imgContainer.appendChild(favBtn);
    imagesGrid.appendChild(imgContainer);
    
    // Add the image to the global array
    generatedImages.push(img.dataset.original);
    
    // If user is logged in, load favorites from localStorage if not already set
    if (currentUser) {
      loadUserFavorites();
    }
  }
}

// Function to open the popup with image at specified index
function openPopup(index) {
  const popupOverlay = document.getElementById("popupOverlay");
  const popupImage = document.getElementById("popupImage");
  popupImage.src = generatedImages[index];
  popupOverlay.style.display = "flex";
}

// Function to close the popup
function closePopup() {
  document.getElementById("popupOverlay").style.display = "none";
}

// Function to download the current image
function downloadCurrentImage() {
  const link = document.createElement("a");
  link.href = generatedImages[currentImageIndex];
  link.download = ""; // Let browser set default filename
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Carousel: show previous image
function showPrevImage() {
  if (generatedImages.length === 0) return;
  currentImageIndex = (currentImageIndex > 0) ? currentImageIndex - 1 : generatedImages.length - 1;
  document.getElementById("popupImage").src = generatedImages[currentImageIndex];
}

// Carousel: show next image
function showNextImage() {
  if (generatedImages.length === 0) return;
  currentImageIndex = (currentImageIndex < generatedImages.length - 1) ? currentImageIndex + 1 : 0;
  document.getElementById("popupImage").src = generatedImages[currentImageIndex];
}

// Slideshow functionality using icons for play (►) and pause (❚❚)
let slideshowInterval = null;
function toggleSlideshow() {
  const btn = document.getElementById("slideshowBtn");
  if (!slideshowInterval) {
    slideshowInterval = setInterval(showNextImage, 3000);
    btn.innerHTML = "❚❚";
  } else {
    clearInterval(slideshowInterval);
    slideshowInterval = null;
    btn.innerHTML = "►";
  }
}

// Toggle favorite: add or remove from favorites array and update localStorage for current user
function toggleFavorite(url, favBtn) {
  if (!currentUser) {
    alert("Please log in to save favorites.");
    return;
  }
  let userData = JSON.parse(localStorage.getItem("user_" + currentUser));
  if (!userData.favorites) userData.favorites = [];
  const index = userData.favorites.indexOf(url);
  if (index === -1) {
    userData.favorites.push(url);
    favBtn.classList.add("favorite");
  } else {
    userData.favorites.splice(index, 1);
    favBtn.classList.remove("favorite");
  }
  localStorage.setItem("user_" + currentUser, JSON.stringify(userData));
  loadUserFavorites();
}

// Load current user's favorites from localStorage and update the favorites modal
function loadUserFavorites() {
  if (!currentUser) return;
  const userData = JSON.parse(localStorage.getItem("user_" + currentUser));
  if (!userData || !userData.favorites) return;
  favoriteImages = userData.favorites;
}

// Show favorites modal
function showFavoritesModal() {
  const favoritesGrid = document.getElementById("favoritesGrid");
  favoritesGrid.innerHTML = "";
  favoriteImages.forEach(url => {
    const favImg = document.createElement("img");
    favImg.src = url.replace("/i/", "/t/");
    favImg.alt = "Favorite Image";
    favImg.addEventListener("click", () => {
      currentImageIndex = generatedImages.indexOf(url);
      openPopup(currentImageIndex);
      closeFavoritesModal();
    });
    favoritesGrid.appendChild(favImg);
  });
  document.getElementById("favoritesModal").style.display = "block";
}

// Close favorites modal
function closeFavoritesModal() {
  document.getElementById("favoritesModal").style.display = "none";
}

// Authentication: Sign Up, Login, Logout
function signupUser(username, password) {
  if (localStorage.getItem("user_" + username)) {
    alert("Username already exists.");
    return false;
  }
  const userData = { password, favorites: [] };
  localStorage.setItem("user_" + username, JSON.stringify(userData));
  alert("Sign up successful! Please log in.");
  return true;
}

function loginUser(username, password) {
  const userData = JSON.parse(localStorage.getItem("user_" + username));
  if (!userData || userData.password !== password) {
    alert("Invalid username or password.");
    return false;
  }
  currentUser = username;
  document.getElementById("authArea").style.display = "none";
  document.getElementById("logoutBtn").style.display = "inline-block";
  loadUserFavorites();
  return true;
}

function logoutUser() {
  currentUser = null;
  document.getElementById("authArea").style.display = "inline-block";
  document.getElementById("logoutBtn").style.display = "none";
  favoriteImages = [];
}

// Event listeners for modals and authentication forms

// Generate button
document.getElementById("generateButton").addEventListener("click", () => {
  document.getElementById("imagesGrid").innerHTML = "";
  generatedImages = [];
  totalImagesLoaded = 0;
  loadNextBatch();
});

// Infinite scrolling: load next batch when near bottom
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 100) {
    loadNextBatch();
  }
});

// Popup event listeners
document.getElementById("downloadBtn").addEventListener("click", downloadCurrentImage);
document.getElementById("prevBtn").addEventListener("click", showPrevImage);
document.getElementById("nextBtn").addEventListener("click", showNextImage);
document.getElementById("slideshowBtn").addEventListener("click", toggleSlideshow);
document.getElementById("popupOverlay").addEventListener("click", function(e) {
  if (e.target === this) {
    closePopup();
  }
});

// Favorites modal events
document.getElementById("favoritesBtn").addEventListener("click", showFavoritesModal);
document.getElementById("closeFavoritesBtn").addEventListener("click", closeFavoritesModal);

// Theme toggle event
document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

// Authentication modals
document.getElementById("loginBtn").addEventListener("click", () => {
  document.getElementById("loginModal").style.display = "flex";
});
document.getElementById("signupBtn").addEventListener("click", () => {
  document.getElementById("signupModal").style.display = "flex";
});
document.getElementById("closeLoginModal").addEventListener("click", () => {
  document.getElementById("loginModal").style.display = "none";
});
document.getElementById("closeSignupModal").addEventListener("click", () => {
  document.getElementById("signupModal").style.display = "none";
});

// Handle login form submission
document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  if (loginUser(username, password)) {
    document.getElementById("loginModal").style.display = "none";
  }
});

// Handle signup form submission
document.getElementById("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value;
  if (signupUser(username, password)) {
    document.getElementById("signupModal").style.display = "none";
  }
});

// Logout event
document.getElementById("logoutBtn").addEventListener("click", () => {
  logoutUser();
});
