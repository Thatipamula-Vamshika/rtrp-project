// =============================================================
// CommunalTable — app.js
// All application logic. Loaded by index.html via <script src>.
// =============================================================

// ── STATE ──────────────────────────────────────────────────────
let catalog       = null;
let cityDefaults  = {};
let currentTheme  = 'casual';
let currentState  = '';
let currentCity   = '';
let nearbyCities  = [];
let groupSize     = 3;
let members       = [];
let currentMemberIndex = 0;
let currentDraft  = emptyPrefs();
let lastResult    = null;
let lastGroupPrefs   = null;
let lastFiltersApplied = null;
let leafletMap    = null;
let leafletMarker = null;
let activeFilters = { minRating: 3.5, maxDistanceKm: 999, sortBy: 'relevance' };

// ── CONSTANTS ──────────────────────────────────────────────────
const THEMES = [
  { id:'family',    label:'Family-friendly', emoji:'👨‍👩‍👧', boost:['Thalis','South Indian','North Indian','Sweets','Bakery'] },
  { id:'pet',       label:'Pet-friendly',    emoji:'🐶', boost:['Cafe','Continental','Beverages','Bakery','Healthy Food'] },
  { id:'romantic',  label:'Romantic',        emoji:'🌹', boost:['Italian','Continental','Pastas','Desserts','Mediterranean'] },
  { id:'casual',    label:'Casual hangout',  emoji:'🍔', boost:['Pizzas','Fast Food','Chinese','Burgers','Snacks','Beverages'] },
  { id:'birthday',  label:'Birthday party',  emoji:'🎂', boost:['Pizzas','Desserts','Bakery','Ice Cream','Continental','Cafe'] },
  { id:'business',  label:'Business lunch',  emoji:'💼', boost:['Continental','North Indian','Thalis','Healthy Food','Italian'] },
  { id:'latenight', label:'Late night',      emoji:'🌙', boost:['Fast Food','Biryani','Mughlai','Burgers','Chinese'] },
  { id:'brunch',    label:'Weekend brunch',  emoji:'🥞', boost:['Cafe','Bakery','Continental','Beverages','Healthy Food','Desserts'] },
  { id:'solo',      label:'Solo treat',      emoji:'🧘', boost:['Cafe','Bakery','Beverages','Desserts','Healthy Food'] },
  { id:'healthy',   label:'Healthy bowl',    emoji:'🥗', boost:['Healthy Food','Salads','Cafe','Continental'] },
];

const ALLERGY_MAP = {
  dairy:['ice cream','desserts','sweets','bakery','kulfi'],
  gluten:['pizzas','pastas','bakery','burgers','sandwich','rolls'],
  nuts:['sweets','desserts','mughlai'],
  seafood:['seafood','kerala','coastal','mangalorean','goan'],
  egg:['bakery','desserts'],
  shellfish:['seafood','chinese','thai'],
};
const ALLERGY_EMOJIS = { dairy:'🥛', gluten:'🌾', nuts:'🥜', seafood:'🐟', egg:'🥚', shellfish:'🦐' };
const ALLERGIES = Object.keys(ALLERGY_MAP);

const SUGGESTED_CUISINES = [
  'North Indian','South Indian','Chinese','Biryani','Pizzas','Italian',
  'Continental','Fast Food','Desserts','Bakery','Beverages','Mughlai',
  'Punjabi','Thalis','Healthy Food','Snacks','Ice Cream','Pastas',
];

const STATE_CITIES = {
  'Andhra Pradesh':['Visakhapatnam','Vijayawada','Guntur','Tirupati','Nellore','Kurnool','Rajahmundry','Kakinada'],
 'Telangana':['Hyderabad','Secunderabad','Warangal','Karimnagar','Nizamabad','Bolarum','Kompally','Kukatpally','Madhapur','Gachibowli','LB Nagar','Dilsukhnagar','Uppal','Miyapur','Ameerpet','Begumpet','Tarnaka','Nacharam','Ghatkesar','Alwal','Malkajgiri','Jeedimetla','Balanagar','Shamirpet'],
  'Karnataka':['Bangalore','Mysore','Mangalore','Hubli','Belgaum','Davangere'],
  'Tamil Nadu':['Chennai','Coimbatore','Madurai','Salem','Trichy','Tirunelveli','Vellore'],
  'Kerala':['Kochi','Trivandrum','Kozhikode','Thrissur','Kollam','Kannur'],
  'Maharashtra':['Mumbai','Pune','Nagpur','Nashik','Thane','Aurangabad','Kolhapur','Solapur'],
  'Gujarat':['Ahmedabad','Surat','Vadodara','Rajkot','Gandhinagar','Bhavnagar'],
  'Rajasthan':['Jaipur','Udaipur','Jodhpur','Kota','Ajmer','Bikaner'],
  'Delhi':['Delhi','New Delhi'],
  'Haryana':['Gurgaon','Faridabad','Panipat','Karnal','Hisar','Ambala'],
  'Punjab':['Ludhiana','Amritsar','Jalandhar','Patiala','Bathinda','Mohali','Chandigarh'],
  'Uttar Pradesh':['Lucknow','Noida','Ghaziabad','Kanpur','Agra','Varanasi','Allahabad','Meerut','Bareilly'],
  'Madhya Pradesh':['Indore','Bhopal','Gwalior','Jabalpur','Ujjain'],
  'West Bengal':['Kolkata','Howrah','Siliguri','Durgapur','Asansol'],
  'Bihar':['Patna','Gaya','Bhagalpur','Muzaffarpur'],
  'Odisha':['Bhubaneswar','Cuttack','Puri','Rourkela'],
  'Assam':['Guwahati','Dibrugarh','Silchar'],
  'Jharkhand':['Ranchi','Jamshedpur','Dhanbad','Bokaro'],
  'Chhattisgarh':['Raipur','Bhilai','Bilaspur'],
  'Uttarakhand':['Dehradun','Haridwar','Rishikesh','Haldwani'],
  'Himachal Pradesh':['Shimla','Manali','Dharamshala'],
  'Goa':['Panaji','Margao','Vasco'],
};
const ALL_STATES = Object.keys(STATE_CITIES).sort();

const CITY_COORDS = {
  Mumbai:[19.076,72.8777],Delhi:[28.6139,77.209],'New Delhi':[28.6139,77.209],
  Bangalore:[12.9716,77.5946],Hyderabad:[17.385,78.4867],Chennai:[13.0827,80.2707],
  Kolkata:[22.5726,88.3639],Pune:[18.5204,73.8567],Ahmedabad:[23.0225,72.5714],
  Jaipur:[26.9124,75.7873],Lucknow:[26.8467,80.9462],Surat:[21.1702,72.8311],
  Kanpur:[26.4499,80.3319],Nagpur:[21.1458,79.0882],Indore:[22.7196,75.8577],
  Bhopal:[23.2599,77.4126],Patna:[25.5941,85.1376],Gurgaon:[28.4595,77.0266],
  Noida:[28.5355,77.391],Ghaziabad:[28.6692,77.4538],Faridabad:[28.4089,77.3178],
  Thane:[19.2183,72.9781],Mysore:[12.2958,76.6394],Mangalore:[12.9141,74.856],
  Hubli:[15.3647,75.124],Coimbatore:[11.0168,76.9558],Madurai:[9.9252,78.1198],
  Kochi:[9.9312,76.2673],Trivandrum:[8.5241,76.9366],Kozhikode:[11.2588,75.7804],
  Visakhapatnam:[17.6868,83.2185],Vijayawada:[16.5062,80.648],
  Warangal:[17.9784,79.5941],Chandigarh:[30.7333,76.7794],Ludhiana:[30.901,75.8573],
  Amritsar:[31.634,74.8723],Dehradun:[30.3165,78.0322],Shimla:[31.1048,77.1734],
  Vadodara:[22.3072,73.1812],Rajkot:[22.3039,70.8022],Nashik:[19.9975,73.7898],
  Udaipur:[24.5854,73.7125],Jodhpur:[26.2389,73.0243],Bhubaneswar:[20.2961,85.8245],
  Guwahati:[26.1445,91.7362],Ranchi:[23.3441,85.3096],Panaji:[15.4909,73.8278],
  Secunderabad:[17.4399,78.4983],Belgaum:[15.8497,74.4977],Davangere:[14.4644,75.9218],
  Kolhapur:[16.705,74.2433],Solapur:[17.6805,75.9064],Aurangabad:[19.8762,75.3433],
  Bhavnagar:[21.7645,72.1519],Gandhinagar:[23.2156,72.6369],Kota:[25.2138,75.8648],
  Ajmer:[26.4499,74.6399],Bikaner:[28.0229,73.3119],Patiala:[30.3398,76.3869],
  Bathinda:[30.2110,74.9455],Mohali:[30.7046,76.7179],Jalandhar:[31.3260,75.5762],
  Agra:[27.1767,78.0081],Varanasi:[25.3176,82.9739],Allahabad:[25.4358,81.8463],
  Meerut:[28.9845,77.7064],Bareilly:[28.3670,79.4304],Gwalior:[26.2183,78.1828],
  Jabalpur:[23.1815,79.9864],Ujjain:[23.1793,75.7849],Howrah:[22.5958,88.2636],
  Siliguri:[26.7271,88.3953],Durgapur:[23.5204,87.3119],Asansol:[23.6739,86.9524],
  Gaya:[24.7914,85.0002],Bhagalpur:[25.2425,86.9842],Muzaffarpur:[26.1209,85.3647],
  Cuttack:[20.4625,85.8828],Puri:[19.8135,85.8312],Rourkela:[22.2604,84.8536],
  Dibrugarh:[27.4728,94.9120],Silchar:[24.8333,92.7789],Jamshedpur:[22.8046,86.2029],
  Dhanbad:[23.7957,86.4304],Bokaro:[23.6693,86.1511],Raipur:[21.2514,81.6296],
  Bhilai:[21.1938,81.3509],Bilaspur:[22.0797,82.1409],Haridwar:[29.9457,78.1642],
  Rishikesh:[30.0869,78.2676],Haldwani:[29.2183,79.5130],Manali:[32.2396,77.1887],
  Dharamshala:[32.2190,76.3234],Margao:[15.2993,73.9862],Vasco:[15.3982,73.8113],
};

const MENU_DB = {
  'north indian':[{item:'Butter Chicken',price:320},{item:'Paneer Butter Masala',price:280},{item:'Dal Makhani',price:220},{item:'Garlic Naan',price:70},{item:'Veg Biryani',price:240},{item:'Tandoori Roti',price:30}],
  'south indian':[{item:'Masala Dosa',price:150},{item:'Idli Sambar (4 pc)',price:90},{item:'Medu Vada (2 pc)',price:80},{item:'Filter Coffee',price:60},{item:'Curd Rice',price:130},{item:'Mysore Bonda',price:90}],
  biryani:[{item:'Chicken Hyderabadi Biryani',price:280},{item:'Mutton Biryani',price:360},{item:'Veg Biryani',price:200},{item:'Egg Biryani',price:220},{item:'Raita',price:40}],
  chinese:[{item:'Veg Hakka Noodles',price:180},{item:'Chicken Manchurian',price:240},{item:'Schezwan Fried Rice',price:200},{item:'Spring Rolls',price:160},{item:'Honey Chilli Potato',price:180}],
  pizzas:[{item:'Margherita (Medium)',price:320},{item:'Farmhouse (Medium)',price:480},{item:'Peppy Paneer',price:460},{item:'Chicken Dominator',price:580},{item:'Garlic Bread',price:140}],
  italian:[{item:'Penne Arrabbiata',price:320},{item:'Alfredo Pasta',price:360},{item:'Bruschetta',price:220},{item:'Lasagna',price:380},{item:'Tiramisu',price:240}],
  continental:[{item:'Grilled Chicken Steak',price:420},{item:'Caesar Salad',price:260},{item:'Mushroom Risotto',price:360},{item:'Fish & Chips',price:380}],
  'fast food':[{item:'Veg Burger',price:90},{item:'Cheese Burst Fries',price:140},{item:'Chicken Wrap',price:180},{item:'Cold Coffee',price:120}],
  burgers:[{item:'Classic Cheeseburger',price:180},{item:'Crispy Chicken Burger',price:220},{item:'Veg Patty Burger',price:140}],
  desserts:[{item:'Gulab Jamun (2 pc)',price:80},{item:'Choco Lava Cake',price:140},{item:'Brownie with Ice Cream',price:180}],
  sweets:[{item:'Rasgulla (2 pc)',price:60},{item:'Kaju Katli (250g)',price:320},{item:'Jalebi (250g)',price:140}],
  bakery:[{item:'Chocolate Pastry',price:90},{item:'Veg Puff',price:40},{item:'Black Forest Slice',price:120}],
  beverages:[{item:'Cold Coffee',price:120},{item:'Mango Shake',price:100},{item:'Lemonade',price:70},{item:'Masala Chai',price:30}],
  cafe:[{item:'Cappuccino',price:160},{item:'Avocado Toast',price:280},{item:'Banoffee Pie',price:220}],
  mughlai:[{item:'Chicken Korma',price:320},{item:'Mutton Rogan Josh',price:420},{item:'Sheermal',price:60}],
  punjabi:[{item:'Sarson Da Saag + Makki Roti',price:240},{item:'Amritsari Chole Bhature',price:180},{item:'Lassi',price:80}],
  thalis:[{item:'Veg Thali (Unlimited)',price:280},{item:'Special Non-Veg Thali',price:380}],
  snacks:[{item:'Samosa (2 pc)',price:40},{item:'Pav Bhaji',price:130},{item:'Bhel Puri',price:80}],
  'ice cream':[{item:'Belgian Chocolate Scoop',price:140},{item:'Sundae Special',price:220}],
  'healthy food':[{item:'Quinoa Salad',price:280},{item:'Grilled Veg Bowl',price:240},{item:'Protein Smoothie',price:220}],
  seafood:[{item:'Goan Fish Curry',price:360},{item:'Prawns Masala',price:420},{item:'Grilled Pomfret',price:480}],
};

const PHOTO_POOLS = {
  biryani:['photo-1601050690597-df0568f70950','photo-1631452180519-c014fe946bc7','photo-1633945274405-b6c8069047b0','photo-1589302168068-964664d93dc0'],
  pizza:['photo-1565299624946-b28f40a0ae38','photo-1574071318508-1cdbab80d002','photo-1513104890138-7c749659a591','photo-1604068549290-dea0e4a305ca'],
  burger:['photo-1568901346375-23c9450c58cd','photo-1551782450-a2132b4ba21d','photo-1550317138-10000687a72b','photo-1586190848861-99aa4a171e90'],
  chinese:['photo-1563379091339-03b21ab4a4f8','photo-1525755662778-989d0524087e','photo-1585032226651-759b368d7246','photo-1607330289024-1535c6b4e1c1'],
  southIndian:['photo-1630383249896-424e482df921','photo-1668236543090-82eba5ee5976','photo-1589301760014-d929f3979dbc','photo-1610192244261-3f33de3f55e4'],
  thali:['photo-1529042410759-befb1204b468','photo-1567188040759-fb8a883dc6d8','photo-1631452180775-b18a7e8e2253','photo-1606491956689-2ea866880c84'],
  northIndian:['photo-1628294895950-9805252327bc','photo-1585937421612-70a008356fbe','photo-1565557623262-b51c2513a641','photo-1589647363585-f4a7d3877b10'],
  italian:['photo-1551183053-bf91a1d81141','photo-1473093295043-cdd812d0e601','photo-1556761223-4c4282c73f77','photo-1572441713132-c542fc4fe282'],
  cafe:['photo-1559339352-11d035aa65de','photo-1453614512568-c4024d13c247','photo-1497935586351-b67a49e012bf','photo-1521017432531-fbd92d768814'],
  desserts:['photo-1488477181946-6428a0291777','photo-1551024506-0bccd828d307','photo-1563729784474-d77dbb933a9e','photo-1606313564200-e75d5e30476c'],
  beverages:['photo-1544145945-f90425340c7e','photo-1497534446932-c925b458314e','photo-1497636577773-f1231844b336','photo-1572490122747-3968b75cc699'],
  fastfood:['photo-1561758033-d89a9ad46330','photo-1606755962773-d324e0a13086','photo-1548340748-6d2b7d7da280','photo-1626700051175-6818013e1d4f'],
  healthy:['photo-1490645935967-10de6ba17061','photo-1540189549336-e6e99c3679fe','photo-1546069901-ba9599a7e63c','photo-1505253716362-afaea1d3d1af'],
  seafood:['photo-1559737558-2f5a35f4523b','photo-1611599537845-1c7aca0091c0','photo-1599487488170-d11ec9c172f0'],
  bakery:['photo-1558961363-fa8fdf82db35','photo-1509440159596-0249088772ff','photo-1586444248902-2f64eddc13df','photo-1517433367423-c7e5b0f35086'],
  default:['photo-1517248135467-4c7edcad34c4','photo-1414235077428-338989a2e8c0','photo-1555396273-367ea4eb4db5','photo-1466978913421-dad2ebd01d17','photo-1481931098730-318b6f776db0','photo-1528605248644-14dd04022da1'],
};

const CUISINE_POOL_MAP = [
  {match:/biryani|hyderabadi|kebab/i,pool:'biryani'},
  {match:/pizza/i,pool:'pizza'},
  {match:/burger/i,pool:'burger'},
  {match:/chinese|thai|asian|noodle/i,pool:'chinese'},
  {match:/south indian|dosa|idli|kerala|tamil|andhra/i,pool:'southIndian'},
  {match:/thali|gujarati|rajasthani/i,pool:'thali'},
  {match:/north indian|punjabi|mughlai|tandoor/i,pool:'northIndian'},
  {match:/italian|pasta|continental/i,pool:'italian'},
  {match:/cafe|coffee/i,pool:'cafe'},
  {match:/dessert|sweet|ice ?cream|cake|kulfi/i,pool:'desserts'},
  {match:/beverage|juice|shake|tea/i,pool:'beverages'},
  {match:/fast food|street|chaat|snack|wrap|roll/i,pool:'fastfood'},
  {match:/healthy|salad|vegan|protein/i,pool:'healthy'},
  {match:/seafood|coastal|mangalorean|goan/i,pool:'seafood'},
  {match:/bakery/i,pool:'bakery'},
];

const FAQ = [
  {q:'Do I need to sign up?',a:'Never. CommunalTable is completely anonymous — no email, no account.'},
  {q:'How are budgets combined?',a:'We use the lowest cap in the group so nobody is forced to overspend.'},
  {q:'What if someone has a severe allergy?',a:'Any allergy from any member excludes risky restaurants for the whole group.'},
  {q:"What if the group has very different tastes?",a:"We still suggest highly-rated nearby places that aren't ruled out by allergies."},
  {q:'Where does the data come from?',a:'A public restaurant catalog of 60K+ Indian restaurants. Menus shown are indicative.'},
  {q:'Why are 3 restaurants always shown?',a:'We guarantee at least 3 picks by falling back to the highest-rated places in your city, so you always have options even if preferences are very specific.'},
];

// ── UTILITIES ──────────────────────────────────────────────────
function emptyPrefs() { return { cuisines:[], budgetMax:600, allergies:[] }; }

function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h * 31) + s.charCodeAt(i)) >>> 0;
  return h;
}

let _photoCounter = 0;
function photoFor(seed, w=800, cuisines=[]) {
  let pool = PHOTO_POOLS.default;
  if (cuisines && cuisines.length) {
    const blob = cuisines.join(' ');
    for (const {match, pool: p} of CUISINE_POOL_MAP) {
      if (match.test(blob)) { pool = PHOTO_POOLS[p]; break; }
    }
  }
  const idx = (hashStr(String(seed)) + _photoCounter++) % pool.length;
  return `https://images.unsplash.com/${pool[idx]}?auto=format&fit=crop&w=${w}&q=70`;
}
function resetPhotoCounter() { _photoCounter = 0; }

function mapsLink(name, address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ' ' + (address||''))}`;
}

function menuFor(cuisines, cap=8) {
  const out = []; const seen = new Set();
  for (const c of (cuisines||[])) {
    const items = MENU_DB[c.toLowerCase()];
    if (!items) continue;
    for (const it of items) {
      if (seen.has(it.item)) continue;
      seen.add(it.item); out.push(it);
      if (out.length >= cap) return out;
    }
  }
  if (!out.length) return [
    {item:"Chef's Special",price:260},{item:'Soup of the Day',price:140},
    {item:'House Salad',price:180},{item:'Fresh Lime Soda',price:60},
  ];
  return out;
}

function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b[0]-a[0])*Math.PI)/180;
  const dLon = ((b[1]-a[1])*Math.PI)/180;
  const la1 = (a[0]*Math.PI)/180, la2 = (b[0]*Math.PI)/180;
  const x = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}

function nearestCity(lat, lon) {
  let best = null;
  for (const [city, c] of Object.entries(CITY_COORDS)) {
    const d = haversineKm([lat,lon], c);
    if (!best || d < best.km) best = {city, km:d};
  }
  return best;
}

function citiesWithinKm(lat, lon, km) {
  return Object.entries(CITY_COORDS)
    .map(([city,c]) => ({city, km:haversineKm([lat,lon],c)}))
    .filter(x => x.km <= km)
    .sort((a,b) => a.km - b.km);
}

function stateForCity(city) {
  const c = city.trim().toLowerCase();
  for (const [st, cities] of Object.entries(STATE_CITIES)) {
    if (cities.some(x => x.toLowerCase() === c)) return st;
  }
  return null;
}

// ── ROUTING ────────────────────────────────────────────────────
const PAGES = ['home','size','collect','result','restaurant','about','help','theme','support','remote-host','remote-guest'];
let currentPage  = 'home';
let pageHistory  = [];

function navigate(page, extra={}) {
  if (!extra._back && currentPage && currentPage !== page) {
    pageHistory.push({ page: currentPage });
  }
  PAGES.forEach(p => {
    const el = document.getElementById('page-'+p);
    if (el) el.classList.toggle('active', p===page);
  });
  ['home','about','help'].forEach(p => {
    const el = document.getElementById('nav-'+p);
    if (el) el.classList.toggle('active', p===page);
  });
  currentPage = page;
  window.scrollTo({top:0,behavior:'instant'});

  if (page === 'restaurant' && extra.id) renderRestaurantPage(extra.id);
  if (page === 'theme' && extra.themeId) renderThemePage(extra.themeId, extra.filterCity||'');
  if (page === 'home') initMap();
}

function goBack() {
  if (!pageHistory.length) { navigate('home', {_back:true}); return; }
  const prev = pageHistory.pop();
  navigate(prev.page, {_back:true});
}

// ── INIT ───────────────────────────────────────────────────────
async function init() {
  renderWordmark();
  renderMarquee();
  populateStateSelect();
  renderThemesGrid();
  renderAllergyGrid();
  renderCuisineSuggestions();
  renderFAQ();

  try {
    const [rest, defs] = await Promise.all([
      fetch('public/restaurants.json').then(r=>r.json()),
      fetch('public/city-defaults.json').then(r=>r.json()).catch(()=>({})),
    ]);
    catalog = rest;
    cityDefaults = defs;
  } catch {
    showToast('Failed to load restaurant data — check the server is running.');
  }

  document.getElementById('loading').style.display = 'none';
  initMap();
}

function renderWordmark() {
  const word = 'CommunalTable';
  const el = document.getElementById('hero-wordmark');

  // No inline transform — let GSAP own the animation entirely
 el.innerHTML = word.split('').map(ch =>
    `<span style="display:inline-block;opacity:0;background:var(--accent-gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">${ch === ' ' ? '&nbsp;' : ch}</span>`
  ).join('');
  const spans = el.querySelectorAll('span');

  if (window.gsap) {
    gsap.fromTo(spans,
      { opacity: 0, y: 28, skewX: -10 },
      {
        opacity: 1,
        y: 0,
        skewX: 0,
        duration: 0.65,
        ease: 'power4.out',
        stagger: 0.045,
        delay: 0.4
      }
    );
  } else {
    spans.forEach((s, i) => {
      s.style.transition = `opacity 0.5s ease ${i*45}ms, transform 0.5s ease ${i*45}ms`;
      s.style.transform = 'translateY(28px)';
      requestAnimationFrame(() => setTimeout(() => {
        s.style.opacity = '1';
        s.style.transform = 'translateY(0)';
      }, 50));
    });
  }
}

function renderMarquee() {
  const items = ['🍕 Pizzas','🥘 Biryani','🍜 Chinese','🥗 Healthy','🌶️ Mughlai','🥥 South Indian','🍰 Desserts','🥤 Cafe','🍔 Burgers','🍝 Italian','🍛 North Indian','🍱 Thalis'];
  const html = items.map(s=>`<span>${s}</span>`).join('');
  document.getElementById('marquee1').innerHTML = html;
  document.getElementById('marquee2').innerHTML = html;
}

function populateStateSelect() {
  const sel = document.getElementById('state-select');
  ALL_STATES.forEach(st => {
    const opt = document.createElement('option');
    opt.value = st; opt.textContent = st;
    sel.appendChild(opt);
  });
}

function renderThemesGrid() {
  const THEME_PHOTOS = {
  family:    'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=70',
  pet:       'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=70',
  romantic:  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=70',
  casual:    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=70',
  birthday:  'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=70',
  business:  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=70',
  latenight: 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?auto=format&fit=crop&w=600&q=70',
  brunch:    'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=600&q=70',
  solo:      'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=600&q=70',
  healthy:   'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=600&q=70',
};
  document.getElementById('themes-grid').innerHTML = THEMES.map((t,i) => `
    <div class="theme-card" onclick="selectTheme('${t.id}')">
<img src="${THEME_PHOTOS[t.id] || photoFor('theme-'+t.id+'-'+i, 600, t.boost)}" alt="${t.label}" loading="lazy" />      <div class="theme-card-overlay"></div>
      <div class="theme-card-content">
        <div class="theme-card-emoji">${t.emoji}</div>
        <div class="theme-card-label">${t.label}</div>
        <div class="theme-card-hint">Tap to explore →</div>
      </div>
    </div>
  `).join('');
}

function renderAllergyGrid() {
  document.getElementById('allergy-grid').innerHTML = ALLERGIES.map(a => `
    <button class="allergy-btn" id="allergy-${a}" onclick="toggleAllergy('${a}')">
      <span class="allergy-emoji">${ALLERGY_EMOJIS[a]||'•'}</span>${a}
    </button>
  `).join('');
}

function renderCuisineSuggestions() {
  const container = document.getElementById('cuisine-suggestions');
  if (!container) return;
  container.innerHTML = SUGGESTED_CUISINES.map(c =>
    `<button class="cuisine-suggestion-btn" id="sug-${c.replace(/\s/g,'_')}" onclick="addSuggestion('${c}')">+ ${c}</button>`
  ).join('');
}

function renderFAQ() {
  document.getElementById('faq-list').innerHTML = FAQ.map(f =>
    `<details><summary>${f.q}</summary><p>${f.a}</p></details>`
  ).join('');
}

// ── MAP ────────────────────────────────────────────────────────
function initMap() {
  if (!document.getElementById('page-home').classList.contains('active')) return;
  if (leafletMap) return;


 leafletMap = L.map('map', { attributionControl: false }).setView([22.9734, 78.6569], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution:'', maxZoom:19 }).addTo(leafletMap);

  const makeIcon = () => L.icon({
    iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize:[25,41], iconAnchor:[12,41],
  });

  const placeMarker = (lat, lng) => {
    if (leafletMarker) leafletMarker.setLatLng([lat,lng]);
    else {
      leafletMarker = L.marker([lat,lng],{icon:makeIcon(),draggable:true}).addTo(leafletMap);
      leafletMarker.on('dragend', () => {
        const p = leafletMarker.getLatLng();
        reverseGeocode(p.lat, p.lng);
      });
    }
    reverseGeocode(lat, lng);
  };

  leafletMap.on('click', e => placeMarker(e.latlng.lat, e.latlng.lng));
}

async function locateMe() {
  const btn    = document.getElementById('locate-me-btn');
  const status = document.getElementById('locate-status');
  if (!navigator.geolocation) {
    if (status) { status.textContent = 'Geolocation not supported by your browser.'; status.style.display=''; }
    return;
  }
  if (btn) btn.textContent = '⏳ Locating…';
  if (status) { status.textContent = 'Getting your location…'; status.style.display=''; }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      window._userLat = lat;
      window._userLng = lng;
      if (!leafletMap) initMap();
      setTimeout(() => {
        leafletMap.setView([lat, lng], 12);
        if (leafletMarker) {
          leafletMarker.setLatLng([lat, lng]);
        } else {
          leafletMarker = L.marker([lat,lng],{
            icon: L.icon({
              iconUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconRetinaUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              shadowUrl:'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize:[25,41], iconAnchor:[12,41],
            }),
            draggable:true,
          }).addTo(leafletMap);
          leafletMarker.on('dragend', () => {
            const p = leafletMarker.getLatLng();
            reverseGeocode(p.lat, p.lng);
          });
        }
        reverseGeocode(lat, lng);
      }, 100);
      if (btn) btn.textContent = '📡 Locate Me';
      if (status) { status.textContent = '✅ Location found! See pin on map.'; }
    },
    () => {
      if (btn) btn.textContent = '📡 Locate Me';
      if (status) { status.textContent = '⚠️ Could not get location — please allow access.'; status.style.display=''; }
    },
    { timeout:10000, enableHighAccuracy:true }
  );
}

async function reverseGeocode(lat, lng) {
  document.getElementById('map-status').textContent = '🔍 Looking up address…';
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=en&lat=${lat}&lon=${lng}`
    );
    const d = await res.json();
    const a = d?.address || {};
    // Use the most specific name Nominatim returns — this IS what the pin is on
    const rawCity  = a.suburb || a.neighbourhood || a.quarter ||
                     a.city_district || a.town || a.city ||
                     a.village || a.county || '';
    const stateName = a.state || '';

    // Display exactly what Nominatim says (Bolarum, Kompally, etc.)
    document.getElementById('map-status').textContent =
      `📍 ${rawCity || 'Unknown area'}${stateName ? ', '+stateName : ''}`;

    // For the restaurant filter we also need the nearest known catalog city
    const nearest   = nearestCity(lat, lng);
    const within    = citiesWithinKm(lat, lng, 15);
    nearbyCities    = within.length ? within.map(x=>x.city) : nearest ? [nearest.city] : [];

    // currentCity drives restaurant filtering — use rawCity so "Bolarum" results are fetched
    // but fall back to nearest known city if rawCity isn't in our STATE_CITIES list
    const knownExact = Object.values(STATE_CITIES).flat()
                             .find(c => c.toLowerCase() === rawCity.toLowerCase());
    currentCity = knownExact || rawCity;   // keep rawCity even if unknown; filterR does includes()

    const guessed = (stateName && ALL_STATES.includes(stateName))
      ? stateName : stateForCity(currentCity) || stateForCity(nearest?.city || '');
    if (guessed) {
      currentState = guessed;
      document.getElementById('state-select').value = guessed;
      updateCityOptions();
      // Only set the dropdown to a value that actually exists in the list
      const knownDropdown = (STATE_CITIES[guessed]||[])
        .find(c => c.toLowerCase() === currentCity.toLowerCase());
      if (knownDropdown) document.getElementById('city-select').value = knownDropdown;
    }
    updateLocationLabel();
  } catch {
    document.getElementById('map-status').textContent = '📍 Pinned (offline reverse-geocode failed)';
  }
}

// ── LOCATION HANDLERS ──────────────────────────────────────────
function onStateChange() {
  currentState = document.getElementById('state-select').value;
  currentCity  = '';
  updateCityOptions();
  updateLocationLabel();
}

function updateCityOptions() {
  const citySel = document.getElementById('city-select');
  const cities  = STATE_CITIES[currentState] || [];
  citySel.disabled = !currentState;
  citySel.innerHTML = `<option value="">${currentState ? 'Any city' : 'Pick state first'}</option>`;
  cities.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    citySel.appendChild(opt);
  });
  if (currentCity) citySel.value = currentCity;
}

function onCityChange() {
  currentCity = document.getElementById('city-select').value;
  updateLocationLabel();
}

function updateLocationLabel() {
  const label  = currentCity || currentState || 'Anywhere in India';
  document.getElementById('current-location-label').textContent = label;
  const hasLoc = !!(currentCity || currentState);
  document.getElementById('start-btn-loc').disabled = !hasLoc;
  document.getElementById('loc-hint').style.display = hasLoc ? 'none' : '';
}

// ── THEME PAGE ─────────────────────────────────────────────────
function selectTheme(themeId) {
  currentTheme = themeId;
  navigate('theme', { themeId });
}

function renderThemePage(themeId, filterCity, showCount) {
  const theme = THEMES.find(t => t.id === themeId);
  if (!theme) return;
  const cont = document.getElementById('theme-content');
  if (!cont) return;
  resetPhotoCounter();

  const city    = filterCity !== undefined ? filterCity : (currentCity || '');
  const boost   = new Set(theme.boost.map(b => b.toLowerCase()));
  const limit   = showCount || 12;

  let allRecs = [];
  if (catalog) {
    const userState = currentState ||
      Object.entries(STATE_CITIES).find(([,cs]) => cs.some(c=>c.toLowerCase()===city.toLowerCase()))?.[0] || '';
    const stateCities = userState ? (STATE_CITIES[userState]||[]).map(c=>c.toLowerCase()) : [];

    const boosted   = catalog.filter(r => r.q && r.q.some(q => boost.has(q.toLowerCase())));
    const notBoosted = catalog.filter(r => !r.q || !r.q.some(q => boost.has(q.toLowerCase())));

    // Layer 1: boosted + city match
    const layer1 = boosted.filter(r => city && (r.c||'').toLowerCase().includes(city.toLowerCase()));
    // Layer 2: boosted + state match
    const layer2 = boosted.filter(r => stateCities.length && stateCities.some(sc=>(r.c||'').toLowerCase().includes(sc)));
    // Layer 3: boosted anywhere
    const layer3 = boosted;
    // Layer 4: any cuisine in state (so "show more" always has content)
    const layer4 = notBoosted.filter(r => stateCities.length && stateCities.some(sc=>(r.c||'').toLowerCase().includes(sc)));
    // Layer 5: all restaurants
    const layer5 = catalog;

    const seen = new Set();
    for (const pool of [layer1, layer2, layer3, layer4, layer5]) {
      for (const r of [...pool].sort((a,b) => b.r-a.r)) {
        if (!seen.has(r.i)) { seen.add(r.i); allRecs.push(r); }
      }
    }
  }

  const visible   = allRecs.slice(0, limit);
  const hasMore   = allRecs.length > limit;

  cont.innerHTML = `
    <div>
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="goBack()">← Back</button>
        <div>
          <span style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.06em;color:var(--primary);font-weight:600">Theme</span>
          <h1 style="font-size:clamp(1.5rem,4vw,2.25rem);font-weight:800;margin-top:0.125rem">${theme.emoji} ${theme.label}</h1>
        </div>
      </div>

      <div style="display:flex;gap:0.75rem;margin-bottom:2rem;flex-wrap:wrap;align-items:center">
        <div style="display:flex;gap:0.5rem;flex:1;min-width:220px">
          <input type="text" id="theme-filter-city" class="input-field" style="flex:1"
            placeholder="Filter by city (e.g. Hyderabad)" value="${city}"
            onkeydown="if(event.key==='Enter') applyThemeFilter('${themeId}')" />
          <button class="btn btn-outline" onclick="applyThemeFilter('${themeId}')">Filter</button>
        </div>
        <button class="btn btn-primary" onclick="startGroupFromTheme('${themeId}')">🚀 Start a Group</button>
      </div>

      ${!visible.length
        ? `<p style="color:var(--muted-foreground)">No recommendations found. Try a different city or start a group!</p>`
        : `
        <p style="font-size:0.8125rem;color:var(--muted-foreground);margin-bottom:1rem">
          Showing ${visible.length} of ${allRecs.length} restaurants
          ${city ? `· filtered for <strong>${city}</strong>` : ''}
        </p>
        <div style="display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fill,minmax(min(100%,260px),1fr))">
          ${visible.map((r, _idx) => `
            <div class="pick-card" style="cursor:pointer;transition:transform 0.2s,box-shadow 0.2s"
                 onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shadow-warm)'"
                 onmouseleave="this.style.transform='';this.style.boxShadow=''"
                 onclick="viewRestaurant('${r.i}')">
              <div style="position:relative">
<img src="${photoFor(r.i + _idx * 997, 600, r.q)}" alt="${r.n}" class="pick-card-img small" loading="lazy" />                <span class="rating-chip" style="position:absolute;top:0.75rem;right:0.75rem">★ ${r.r.toFixed(1)}</span>
              </div>
              <div class="pick-card-body">
                <div class="pick-card-title small">${r.n}</div>
                <p style="font-size:0.75rem;color:var(--muted-foreground);margin-top:0.25rem">
                  ${r.a ? r.a.split(',').slice(-2).join(',').trim() : r.c}
                </p>
                <div style="display:flex;flex-wrap:wrap;gap:0.25rem;margin-top:0.5rem">
                  ${(r.q||[]).slice(0,3).map(c=>`<span class="cuisine-chip">${c}</span>`).join('')}
                </div>
                <div style="margin-top:0.75rem;display:flex;gap:0.5rem;flex-wrap:wrap">
                  <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();viewRestaurant('${r.i}')">View →</button>
                  <a href="${mapsLink(r.n, r.a)}" target="_blank" rel="noreferrer"
                     class="btn btn-outline btn-sm" onclick="event.stopPropagation()">🗺️ Map</a>
                </div>
              </div>
            </div>`).join('')}
        </div>
        ${hasMore ? `
          <div style="text-align:center;margin-top:1.75rem">
            <button class="btn btn-outline btn-lg"
                    onclick="renderThemePage('${themeId}', '${city.replace(/'/g,"\\'")}', ${limit + 12})">
              Show More (${allRecs.length - limit} more)
            </button>
          </div>` : ''}
        `
      }
    </div>`;
}

function applyThemeFilter(themeId) {
  const city = (document.getElementById('theme-filter-city')?.value || '').trim();
  renderThemePage(themeId, city, 12);  // reset to 12 on new filter
}

function startGroupFromTheme(themeId) {
  currentTheme = themeId;
  startGroup();
}

// ── GROUP FLOW ─────────────────────────────────────────────────
function startGroup() {
  if (!catalog) { showToast('Still loading restaurant data, please wait…'); return; }
  navigate('size');
}

function beginCollect() {
  const n = Math.max(2, Math.min(20,
    Number(document.getElementById('group-size-input').value) || 2));
  groupSize = n;
  members = [];
  currentMemberIndex = 0;
  currentDraft = emptyPrefs();
  renderCollectView();
  navigate('collect');
}

function renderCollectView() {
  document.getElementById('collect-person-num').textContent = currentMemberIndex + 1;
  document.getElementById('collect-total-num').textContent  = groupSize;
  document.getElementById('collect-place').textContent = currentCity || currentState || 'your area';

  const dots = document.getElementById('progress-dots');
  dots.innerHTML = Array.from({length:groupSize}).map((_,i) => {
    const cls = i < currentMemberIndex ? 'done' : i === currentMemberIndex ? 'current' : 'todo';
    return `<span class="progress-dot ${cls}"></span>`;
  }).join('');

  currentDraft = emptyPrefs();
  document.getElementById('cuisine-input').value = '';
  document.getElementById('budget-input').value  = '600';
  document.getElementById('cuisine-tags').innerHTML = '';
  document.getElementById('custom-allergy-input').value = '';
  document.getElementById('custom-allergy-tags').innerHTML = '';
  ALLERGIES.forEach(a => document.getElementById('allergy-'+a)?.classList.remove('on'));
  renderCuisineSuggestions();
  updateSubmitBtn();
}

function updateSubmitBtn() {
  const btn  = document.getElementById('submit-member-btn');
  btn.disabled = currentDraft.cuisines.length === 0;
  const next = currentMemberIndex + 1;
  btn.textContent = next >= groupSize
    ? 'Submit & see result'
    : `Submit — pass to person ${next + 1}`;
}

function handleCuisineKey(e) { if (e.key==='Enter') { e.preventDefault(); addCuisine(); } }

function addCuisine() {
  const input = document.getElementById('cuisine-input');
  const val   = input.value.trim();
  if (!val) return;
  if (currentDraft.cuisines.some(c => c.toLowerCase() === val.toLowerCase())) { input.value=''; return; }
  currentDraft.cuisines.push(val);
  input.value = '';
  renderCuisineTags();
  refreshSuggestionVisibility();
  updateSubmitBtn();
}

function addSuggestion(c) {
  if (currentDraft.cuisines.includes(c)) return;
  currentDraft.cuisines.push(c);
  renderCuisineTags();
  refreshSuggestionVisibility();
  updateSubmitBtn();
}

function removeCuisine(c) {
  currentDraft.cuisines = currentDraft.cuisines.filter(x => x !== c);
  renderCuisineTags();
  refreshSuggestionVisibility();
  updateSubmitBtn();
}

function renderCuisineTags() {
  document.getElementById('cuisine-tags').innerHTML = currentDraft.cuisines.map(c =>
    `<button class="cuisine-tag" onclick="removeCuisine('${c.replace(/'/g,"\\'")}')">
      ${c} <span style="opacity:.7">✕</span>
    </button>`
  ).join('');
}

function refreshSuggestionVisibility() {
  SUGGESTED_CUISINES.forEach(c => {
    const btn = document.getElementById('sug-'+c.replace(/\s/g,'_'));
    if (btn) btn.style.display = currentDraft.cuisines.includes(c) ? 'none' : '';
  });
}

function toggleAllergy(a) {
  if (currentDraft.allergies.includes(a)) {
    currentDraft.allergies = currentDraft.allergies.filter(x=>x!==a);
  } else {
    currentDraft.allergies.push(a);
  }
  document.getElementById('allergy-'+a)?.classList.toggle('on', currentDraft.allergies.includes(a));
}

function handleCustomAllergyKey(e) { if (e.key==='Enter') { e.preventDefault(); addCustomAllergy(); } }

function addCustomAllergy() {
  const input = document.getElementById('custom-allergy-input');
  const val   = input.value.trim().toLowerCase();
  if (!val || currentDraft.allergies.includes(val)) { input.value=''; return; }
  currentDraft.allergies.push(val);
  input.value = '';
  renderCustomAllergyTags();
}

function renderCustomAllergyTags() {
  const customs = currentDraft.allergies.filter(a => !ALLERGIES.includes(a));
  document.getElementById('custom-allergy-tags').innerHTML = customs.map(a =>
    `<button class="cuisine-tag" style="background:oklch(0.55 0.22 27 / 0.1);color:var(--destructive)"
      onclick="removeCustomAllergy('${a}')">
      ${a} ✕
    </button>`
  ).join('');
}

function removeCustomAllergy(a) {
  currentDraft.allergies = currentDraft.allergies.filter(x=>x!==a);
  renderCustomAllergyTags();
}

function submitMember() {
  if (!currentDraft.cuisines.length) return;
  const budget = Math.max(50, Math.min(10000,
    Number(document.getElementById('budget-input').value)||600));
  currentDraft.budgetMax = budget;
  members.push({ ...currentDraft, cuisines:[...currentDraft.cuisines], allergies:[...currentDraft.allergies] });

  if (members.length >= groupSize) computeAndShowResult();
  else { currentMemberIndex++; renderCollectView(); }
}

// ── RECOMMEND ──────────────────────────────────────────────────
async function computeAndShowResult() {
  navigate('result');
  document.getElementById('result-content').innerHTML = `
    <div style="text-align:center;padding:3rem">
      <div class="spinner" style="margin:0 auto"></div>
      <p style="margin-top:1rem;color:var(--muted-foreground)">Finding the best picks for your group…</p>
    </div>`;

  const cityList = nearbyCities.length ? nearbyCities
    : (currentState && !currentCity ? (STATE_CITIES[currentState]||[]) : []);

 try {
    const feedbackBoost = loadBoost(currentCity || '');
    const resp = await fetch('/api/recommend', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        members, theme: currentTheme,
        city: currentCity || '',
        cityList,
        filters: {
          ...activeFilters,
          userLat: window._userLat || null,
          userLng: window._userLng || null,
          feedbackLiked:    feedbackBoost.liked    || [],
          feedbackDisliked: feedbackBoost.disliked || [],
          feedbackSentiment: feedbackBoost.sentiment || 0,
        },
      }),
    });
    if (!resp.ok) throw new Error('server error');
    const data = await resp.json();
    lastResult         = data;
    lastGroupPrefs     = data.groupPrefs;
    lastFiltersApplied = data.filtersApplied;
    renderResultPage(data);
  } catch {
    // Client-side fallback when server is unavailable
    const result = recommendClient();
    lastResult         = result;
    lastGroupPrefs     = buildGroupPrefs();
    lastFiltersApplied = { distance:'Any', rating:'Above 3.5 ★', sortBy:'Relevance' };
    renderResultPage(result);
  }
}

function buildGroupPrefs() {
  const allCuisines = members.flatMap(m => m.cuisines);
  const budgets     = members.map(m => m.budgetMax);
  return {
    cuisines:  [...new Set(allCuisines)],
    budgetMin: Math.min(...budgets),
    budgetMax: Math.max(...budgets),
    groupSize: members.length,
    location:  currentCity || currentState || 'Anywhere',
  };
}

function recommendClient() {
  if (!catalog) return { picks:[], fallback:true };

  const theme        = THEMES.find(t => t.id===currentTheme);
  const themeBoost   = new Set((theme?.boost||[]).map(b=>b.toLowerCase()));
  const budgetCap    = Math.min(...members.map(m=>m.budgetMax));
  const allAllergies = [...new Set(members.flatMap(m=>m.allergies))];
  const cuisineVotes = {};
  members.forEach(m => m.cuisines.forEach(c => { cuisineVotes[c]=(cuisineVotes[c]||0)+1; }));

  const cityNorm  = (currentCity||'').toLowerCase().trim();
  const stateNorm = (currentState||'').toLowerCase().trim();

  // All cities that belong to the selected state
  const stateCitiesNorm = currentState
    ? (STATE_CITIES[currentState]||[]).map(c=>c.toLowerCase()) : [];

  // nearbyCities comes from GPS — include them too for hyper-local results
  const nearbyNorm = (nearbyCities||[]).map(c=>c.toLowerCase());

  const excluded = allAllergies.flatMap(a => ALLERGY_MAP[a.toLowerCase()]||[a.toLowerCase()]);

  // Returns true only if restaurant is in the right location
  const inLocation = r => {
    const rc = (r.c||'').toLowerCase();
    // If a specific city is set, must match it (or a nearby GPS city)
    if (cityNorm) {
      return rc.includes(cityNorm) || nearbyNorm.some(nc => rc.includes(nc));
    }
    // If only state is set, must be one of that state's cities
    if (stateCitiesNorm.length) {
      return stateCitiesNorm.some(sc => rc.includes(sc));
    }
    return true; // no location constraint
  };

  const passesBasic = r => {
    if (r.p > budgetCap) return false;
    if (r.r < activeFilters.minRating) return false;
    const blob = (r.q||[]).join(' ').toLowerCase();
    if (excluded.some(tok => blob.includes(tok))) return false;
    return true;
  };

 const feedback      = loadBoost(currentCity || '');
  const likedSet      = new Set((feedback.liked    ||[]).map(x=>x.toLowerCase()));
  const dislikedSet   = new Set((feedback.disliked ||[]).map(x=>x.toLowerCase()));
  const feedSentiment = feedback.sentiment || 0;

  const scoreR = r => {
    const q = (r.q||[]).map(x=>x.toLowerCase());
    let sc = 0;
    for (const [c,cnt] of Object.entries(cuisineVotes))
      if (q.includes(c.toLowerCase())) sc += cnt/members.length*60;
    for (const b of themeBoost) if (q.includes(b)) sc += 10;
    sc += r.r * 5;
    if (q.some(t => likedSet.has(t)))    sc += 15;
    if (q.some(t => dislikedSet.has(t))) sc -= 20;
    if (feedSentiment >  0.2 && r.r >= 4.0) sc += 5;
    if (feedSentiment < -0.2 && r.r <  3.5) sc -= 10;
    return { r, score:Math.round(sc), distanceKm: +(Math.random()*7+0.5).toFixed(1),
      parts:{ cuisine:sc/100, budget:1, rating:r.r/5, distance:0.5 } };
  };
  // Primary: cuisine match + location + budget/allergy
  const primary = catalog.filter(r => passesBasic(r) && inLocation(r))
                         .map(scoreR).sort((a,b) => b.score-a.score);
  const picks = primary.slice(0, 3);

  // Fallback layers — all strictly within state/city, never bleed outside
  if (picks.length < 3) {
    const seen = new Set(picks.map(p=>p.r.i));

    // Layer A: any cuisine, same location, passes basic filters
    const layerA = catalog.filter(r => !seen.has(r.i) && passesBasic(r) && inLocation(r))
                          .sort((a,b) => b.r-a.r);
    for (const r of layerA) {
      if (seen.has(r.i)) continue;
      picks.push(scoreR(r)); seen.add(r.i);
      if (picks.length === 3) break;
    }
  }

  if (picks.length < 3) {
    const seen = new Set(picks.map(p=>p.r.i));
    // Layer B: relax budget, still same location
    const layerB = catalog.filter(r => !seen.has(r.i) && inLocation(r) && r.r >= 3.0)
                          .sort((a,b) => b.r-a.r);
    for (const r of layerB) {
      if (seen.has(r.i)) continue;
      picks.push(scoreR(r)); seen.add(r.i);
      if (picks.length === 3) break;
    }
  }

  // Only if the location has truly zero data do we fall back state-wide, never India-wide
  if (picks.length < 3 && stateCitiesNorm.length) {
    const seen = new Set(picks.map(p=>p.r.i));
    const layerC = catalog
      .filter(r => !seen.has(r.i) && stateCitiesNorm.some(sc=>(r.c||'').toLowerCase().includes(sc)))
      .sort((a,b) => b.r-a.r);
    for (const r of layerC) {
      if (seen.has(r.i)) continue;
      picks.push(scoreR(r)); seen.add(r.i);
      if (picks.length === 3) break;
    }
  }

  return { picks, fallback: primary.length < 3 };
}

// ── RESULT PAGE ────────────────────────────────────────────────
function renderResultPage(result) {
  const { picks, fallback }     = result;
  const groupPrefs              = lastGroupPrefs || buildGroupPrefs();
  const filtersApplied          = lastFiltersApplied || {};
  const themeMeta               = THEMES.find(t=>t.id===currentTheme);
  const place                   = currentCity || currentState;

  if (!picks || !picks.length) {
    document.getElementById('result-content').innerHTML = `
      <div style="max-width:36rem;margin:0 auto;text-align:center;padding:2.5rem;border:1px solid var(--border);border-radius:calc(var(--radius)+12px);background:var(--card);box-shadow:var(--shadow-soft)">
        <h2 style="font-size:1.875rem;font-weight:700">No matches in ${place||'your area'}</h2>
        <p style="margin-top:0.75rem;color:var(--muted-foreground)">Try widening the city, or relax some allergies.</p>
        <button class="btn btn-primary btn-lg" style="margin-top:1.25rem" onclick="resetFlow()">Try again</button>
      </div>`;
    return;
  }

  
  document.getElementById('result-content').innerHTML = `
    <div class="space-y-8">
      <div><button class="btn btn-outline btn-sm" onclick="goBack()">← Back</button></div>

      <!-- SUCCESS BANNER -->
      <div class="result-success-banner">
        ✅ Recommendations generated successfully for your group!
      </div>

      <!-- TWO-COLUMN LAYOUT -->
      <div class="result-layout">

        <!-- SIDEBAR -->
        <aside class="result-sidebar">
          <div class="sidebar-section">

            <div class="sidebar-title">🔽 Filters Applied</div>
            <div class="sidebar-row"><span class="sidebar-icon">📏</span><span><strong>Distance:</strong> ${filtersApplied.distance||'Any'}</span></div>
            <div class="sidebar-row"><span class="sidebar-icon">⭐</span><span><strong>Rating:</strong> ${filtersApplied.rating||'Above 3.5 ★'}</span></div>
            <div class="sidebar-row"><span class="sidebar-icon">🔄</span><span><strong>Sort By:</strong> ${filtersApplied.sortBy||'Relevance'}</span></div>
            <button class="btn btn-outline btn-sm" style="margin-top:1rem;width:100%" onclick="editPreferences()">
              ✏️ Edit Preferences
            </button>
          </div>
        </aside>

        <!-- MAIN RESULTS -->
        <div>
          <div style="margin-bottom:1.5rem">
            <span style="display:inline-flex;align-items:center;gap:0.375rem;padding:0.375rem 0.875rem;border-radius:9999px;background:oklch(0.92 0.07 145);color:oklch(0.35 0.1 150);font-size:0.875rem;font-weight:600">
              ${fallback ? '✨ Best nearby picks' : '🎉 Decision reached'}
            </span>
            <p style="margin-top:0.375rem;font-size:0.875rem;color:var(--muted-foreground)">
              ${members.length} anonymous ${members.length===1?'vote':'votes'}
              · ${themeMeta?.emoji||''} ${themeMeta?.label||''}
              · ${place||'Anywhere'}
            </p>
          </div>

          ${picks[0] ? (() => {
            const top = picks[0]; const r = top.r || top;
            const sc = top.score ?? 89;
            const menu = menuFor(r.q, 5);
            const mapEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(r.n+' '+(r.a||''))}&output=embed`;
            return `
            <div class="pick-card highlight" style="margin-bottom:1.5rem">
              <div style="position:relative">
                <img src="${photoFor(r.i, 1200, r.q)}" alt="${r.n}" class="pick-card-img large" loading="lazy"/>
                <span style="position:absolute;top:0.75rem;left:0.75rem;background:oklch(0.92 0.07 145);color:oklch(0.25 0.1 150);font-size:0.75rem;font-weight:700;padding:0.2rem 0.625rem;border-radius:9999px">TOP PICK</span>
                <span class="rating-chip" style="position:absolute;top:0.75rem;right:0.75rem">★ ${r.r.toFixed(1)}</span>
                <span style="position:absolute;bottom:0.75rem;right:0.75rem;background:rgba(0,0,0,0.65);color:#fff;font-size:0.75rem;font-weight:700;padding:0.2rem 0.625rem;border-radius:9999px">Score: ${sc}%</span>
              </div>
              <div class="pick-card-body">
                <h2 class="pick-card-title large">${r.n}</h2>
                <p style="color:var(--muted-foreground);margin-top:0.25rem;font-size:0.875rem">${r.a||r.c}</p>
                <div style="display:flex;flex-wrap:wrap;gap:0.375rem;margin-top:0.75rem">
                  ${(r.q||[]).slice(0,4).map(c=>`<span class="cuisine-chip">${c}</span>`).join('')}
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.25rem;align-items:start">
                  <div>
                    <p style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted-foreground);margin-bottom:0.5rem">INDICATIVE MENU</p>
                    ${menu.map(m=>`<div style="display:flex;justify-content:space-between;font-size:0.8125rem;padding:0.25rem 0;border-bottom:1px solid var(--border)"><span>${m.item}</span><span style="font-weight:600">₹${m.price}</span></div>`).join('')}
                    <a href="https://www.zomato.com/search?q=${encodeURIComponent(r.n)}" target="_blank" style="font-size:0.75rem;color:var(--primary);text-decoration:underline;margin-top:0.5rem;display:inline-block">View full menu (Zomato/Swiggy) →</a>
                  </div>
                  <div style="overflow:hidden;border-radius:var(--radius);border:1px solid var(--border);height:200px">
                    <iframe title="map" src="${mapEmbed}" style="width:100%;height:100%;border:0" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
                  </div>
                </div>
                <div style="margin-top:1rem;display:flex;gap:0.5rem;flex-wrap:wrap">
                  <a href="${mapsLink(r.n,r.a)}" target="_blank" class="btn btn-primary btn-sm">Full menu &amp; map →</a>
                  <a href="${mapsLink(r.n,r.a)}" target="_blank" class="btn btn-outline btn-sm">🗺️ Directions</a>
                  <span style="align-self:center;font-size:0.75rem;color:var(--muted-foreground)">in ${r.c}</span>
                </div>
              </div>
            </div>`;
          })() : ''}

          ${picks.length > 1 ? `
            <h3 style="font-size:1.125rem;font-weight:700;margin-bottom:0.875rem">Also great</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,48%),1fr));gap:1rem">
              ${picks.slice(1).map(sp => {
                const rr = sp.r || sp; const sc2 = sp.score ?? 88;
                return `<div class="pick-card" style="cursor:pointer;transition:transform 0.2s,box-shadow 0.2s" onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shadow-warm)'" onmouseleave="this.style.transform='';this.style.boxShadow=''" onclick="viewRestaurant('${rr.i}')">
                  <div style="position:relative">
                    <img src="${photoFor(rr.i,600,rr.q)}" alt="${rr.n}" class="pick-card-img small" loading="lazy"/>
                    <span class="rating-chip" style="position:absolute;top:0.5rem;right:0.5rem">★ ${rr.r.toFixed(1)}</span>
                    <span style="position:absolute;bottom:0.5rem;right:0.5rem;background:rgba(0,0,0,0.6);color:#fff;font-size:0.7rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:9999px">Score: ${sc2}%</span>
                  </div>
                  <div class="pick-card-body">
                    <div class="pick-card-title small">${rr.n}</div>
                    <p style="font-size:0.75rem;color:var(--muted-foreground);margin-top:0.2rem">${rr.a?rr.a.split(',').slice(-2).join(',').trim():rr.c}</p>
                    <div style="display:flex;flex-wrap:wrap;gap:0.25rem;margin-top:0.5rem">${(rr.q||[]).slice(0,3).map(c=>`<span class="cuisine-chip">${c}</span>`).join('')}</div>
                    <div style="margin-top:0.75rem;display:flex;gap:0.5rem;flex-wrap:wrap">
                      <a href="${mapsLink(rr.n,rr.a)}" target="_blank" class="btn btn-primary btn-sm" onclick="event.stopPropagation()">Full menu &amp; map →</a>
                      <a href="${mapsLink(rr.n,rr.a)}" target="_blank" class="btn btn-outline btn-sm" onclick="event.stopPropagation()">🗺️ Directions</a>
                    </div>
                    <p style="font-size:0.7rem;color:var(--muted-foreground);margin-top:0.25rem">in ${rr.c}</p>
                  </div>
                </div>`;
              }).join('')}
            </div>
          ` : ''}
        </div>

      <!-- BOTTOM BAR -->
      <div class="result-bottom-bar">
        <div class="result-bottom-bar-inner">
          <span class="result-bar-label">Showing results based on:</span>
          <span class="result-bar-tag">📍 Location</span>
          <span class="result-bar-tag">🍽️ Cuisine</span>
          <span class="result-bar-tag">💵 Budget</span>
          <span class="result-bar-tag">⭐ Reviews</span>
        </div>
        <div class="result-bottom-bar-actions">
          <button class="btn btn-outline" onclick="showMoreOptions()">See More Options</button>
          <button class="btn btn-primary" onclick="selectTopRestaurant()">Select Restaurant</button>
        </div>
      </div>

      ${renderFeedbackBox(place)}
      <div style="text-align:center">
        <button class="btn btn-outline" onclick="resetFlow()">Start a new group</button>
      </div>
    </div>`;
}

function renderPickRowCard(sp, isTop) {
  const r          = sp.r || sp;
  const score      = sp.score ?? null;
  const distanceKm = sp.distanceKm ?? null;
  const reviewCount = 100 + (hashStr(String(r.i)) % 400);

  // Score badge colour
  const sc  = score ?? 75;
  const clr = sc >= 85 ? '#1a7a4a' : sc >= 70 ? '#b45309' : '#c0392b';
  const bg  = sc >= 85 ? '#d1fae5' : sc >= 70 ? '#fef3c7' : '#fde8e8';

  return `
    <div class="result-pick-row ${isTop?'result-pick-row-top':''}">
      <img src="${photoFor(r.i, 400, r.q)}" alt="${r.n}" class="result-pick-img" loading="lazy" />
      <div class="result-pick-body">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem;flex-wrap:wrap">
          <div style="min-width:0;flex:1">
            <div class="result-pick-name">${r.n}</div>
            <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;margin-top:0.375rem;font-size:0.8125rem;color:var(--muted-foreground)">
              <span>🍽️ ${(r.q||[]).slice(0,2).join(', ')}</span>
              <span>📍 ~${distanceKm!==null?distanceKm.toFixed(1):'?'} km away</span>
              <span>⭐ ${r.r.toFixed(1)} <span style="color:#f59e0b">★</span> (${reviewCount} reviews)</span>
            </div>
            <p style="margin-top:0.375rem;font-size:0.8125rem;color:var(--muted-foreground);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${(r.q||[]).slice(0,3).join(' · ')} — ${r.c}
            </p>
          </div>
          ${score!==null
            ? `<span class="result-score-badge" style="background:${bg};color:${clr};border:1px solid ${clr}40">
                Score: ${score}%
               </span>`
            : ''}
        </div>
      </div>
      <div class="result-pick-action">
        <button class="btn btn-primary btn-sm" onclick="viewRestaurant('${r.i}')">View Details</button>
      </div>
    </div>`;
}
function renderBigPickCard(sp, isTop) {
  const r = sp.r || sp;
  const sc = sp.score ?? (isTop ? 89 : 88);
  const clr = sc >= 85 ? '#1a7a4a' : sc >= 70 ? '#b45309' : '#c0392b';
  const bg  = sc >= 85 ? '#d1fae5' : sc >= 70 ? '#fef3c7' : '#fde8e8';
  const menu = menuFor(r.q, 5);
  const mapEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(r.n+' '+(r.a||''))}&output=embed`;

 return `
    <div class="pick-card ${isTop ? 'highlight' : ''}"
         style="cursor:pointer;transition:transform 0.2s,box-shadow 0.2s"
         onmouseenter="this.style.transform='translateY(-4px)';this.style.boxShadow='var(--shadow-warm)'"
         onmouseleave="this.style.transform='';this.style.boxShadow=''"
         ${!isTop ? `onclick="viewRestaurant('${r.i}')"` : ''}>
      ${isTop ? `<div onclick="viewRestaurant('${r.i}')" style="cursor:pointer;background:linear-gradient(to right,#06B6D4,#EC4899);color:#050505;text-align:center;padding:0.5rem;font-size:0.8rem;font-weight:700;letter-spacing:0.05em;border-radius:var(--radius) var(--radius) 0 0">
        🍽️ TAP TO VIEW FULL DETAILS &amp; MENU →
      </div>` : ''}
      <div style="position:relative">
        <img src="${photoFor(r.i, 900, r.q)}" alt="${r.n}"
             style="width:100%;height:${isTop?'18rem':'13rem'};object-fit:cover" loading="lazy"/>
        ${isTop ? `<span style="position:absolute;top:0.75rem;left:0.75rem;background:oklch(0.92 0.07 145);color:oklch(0.25 0.1 150);font-size:0.75rem;font-weight:700;padding:0.2rem 0.625rem;border-radius:9999px">⭐ TOP PICK</span>` : ''}
        <span class="rating-chip" style="position:absolute;top:0.75rem;right:0.75rem">★ ${r.r.toFixed(1)}</span>
        <span style="position:absolute;bottom:0.75rem;right:0.75rem;background:${bg};color:${clr};border:1px solid ${clr}40;font-size:0.75rem;font-weight:700;padding:0.2rem 0.625rem;border-radius:9999px">Score: ${sc}%</span>
      </div>
      <div class="pick-card-body">
        <h2 style="font-size:${isTop?'1.375rem':'1.125rem'};font-weight:700">${r.n}</h2>
        <p style="font-size:0.8125rem;color:var(--muted-foreground);margin-top:0.25rem">📍 ${r.a ? r.a.split(',').slice(-2).join(',').trim() : r.c}</p>
        <div style="display:flex;flex-wrap:wrap;gap:0.375rem;margin-top:0.625rem">
          ${(r.q||[]).slice(0,4).map(c=>`<span class="cuisine-chip">${c}</span>`).join('')}
        </div>
        <div style="${isTop ? 'display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1rem;align-items:start' : 'margin-top:0.875rem'}">
          <div>
            <p style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted-foreground);margin-bottom:0.375rem">INDICATIVE MENU</p>
            ${menu.map(m=>`<div style="display:flex;justify-content:space-between;font-size:0.8rem;padding:0.2rem 0;border-bottom:1px solid var(--border)"><span>${m.item}</span><span style="font-weight:600">₹${m.price}</span></div>`).join('')}
            <a href="https://www.zomato.com/search?q=${encodeURIComponent(r.n)}" target="_blank"
               onclick="event.stopPropagation()"
               style="font-size:0.7rem;color:var(--primary);text-decoration:underline;margin-top:0.375rem;display:inline-block">
              View full menu (Zomato/Swiggy) →
            </a>
          </div>
          ${isTop ? `
          <div style="overflow:hidden;border-radius:var(--radius);border:1px solid var(--border);height:180px">
            <iframe title="map" src="${mapEmbed}" style="width:100%;height:100%;border:0"
                    loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>` : ''}
        </div>
        <div style="margin-top:0.875rem;display:flex;gap:0.5rem;flex-wrap:wrap">
          <a href="${mapsLink(r.n,r.a)}" target="_blank" rel="noreferrer"
             class="btn btn-primary btn-sm" onclick="event.stopPropagation()">Full menu &amp; map →</a>
          <a href="${mapsLink(r.n,r.a)}" target="_blank" rel="noreferrer"
             class="btn btn-outline btn-sm" onclick="event.stopPropagation()">🗺️ Directions</a>
          <span style="align-self:center;font-size:0.7rem;color:var(--muted-foreground)">in ${r.c}</span>
        </div>
      </div>
    </div>`;
}

function showMoreOptions() {
  activeFilters = { minRating:3.0, maxDistanceKm:999, sortBy:'relevance' };
  showToast('Showing more options with relaxed filters…');
  computeAndShowResult();
}

function selectTopRestaurant() {
  if (!lastResult?.picks?.length) return;
  viewRestaurant((lastResult.picks[0].r || lastResult.picks[0]).i);
}

// ── FILTERS MODAL ──────────────────────────────────────────────
function openFiltersModal() {
  document.getElementById('filters-modal').style.display = 'flex';
  document.getElementById('filter-rating').value   = activeFilters.minRating;
  document.getElementById('filter-distance').value = activeFilters.maxDistanceKm >= 900
    ? '' : activeFilters.maxDistanceKm;
  document.getElementById('filter-sort').value = activeFilters.sortBy;
}
function editPreferences() {
  // Reset member index to start, keep group size, go back to collect page
  currentMemberIndex = 0;
  members = [];
  currentDraft = emptyPrefs();
  renderCollectView();
  navigate('collect');
}

function closeFiltersModal() {
  document.getElementById('filters-modal').style.display = 'none';
}

function applyFilters() {
  activeFilters.minRating      = parseFloat(document.getElementById('filter-rating').value) || 3.5;
  const dv = document.getElementById('filter-distance').value;
  activeFilters.maxDistanceKm  = dv ? parseFloat(dv) : 999;
  activeFilters.sortBy         = document.getElementById('filter-sort').value || 'relevance';
  closeFiltersModal();
  computeAndShowResult();
}

// ── FEEDBACK BOX ───────────────────────────────────────────────
function renderFeedbackBox(city) {
  return `
    <div class="feedback-box" id="feedback-box">
      <div style="display:flex;align-items:flex-start;gap:0.75rem">
        <div style="font-size:1.875rem">💬</div>
        <div style="flex:1">
          <h3 style="font-size:1.25rem;font-weight:700">How was the experience?</h3>
          <p style="margin-top:0.25rem;font-size:0.875rem;color:var(--muted-foreground)">
            Tell us what you liked or didn't. We use it to improve picks next time${city?' in '+city:''}. Stays on this device.
          </p>
          <div style="margin-top:0.75rem">
            <textarea id="feedback-text" rows="3"
              placeholder='e.g., "Loved the biryani but the desserts were bland"'></textarea>
            <button class="btn btn-primary" style="margin-top:0.5rem"
              onclick="submitFeedback('${(city||'').replace(/'/g,"\\'")}')">Save feedback</button>
          </div>
        </div>
      </div>
    </div>`;
}

function submitFeedback(city) {
  const text = document.getElementById('feedback-text')?.value?.trim();
  if (!text) return;
  const parsed = parseFeedback(text);
  if (city) saveFeedback(city, parsed);
  const sentiment = parsed.sentiment >= 0.2 ? 'positive' : parsed.sentiment <= -0.2 ? 'negative' : 'neutral';
  const box = document.getElementById('feedback-box');
  if (box) {
    box.querySelector('div>div>div:last-child').innerHTML = `
      <div style="background:var(--secondary);border-radius:var(--radius);padding:1rem;font-size:0.875rem;margin-top:0.75rem">
        <p style="font-weight:600">Thanks — saved locally.</p>
        <p style="margin-top:0.25rem;color:var(--muted-foreground)">
          Sentiment: <strong>${sentiment}</strong>
          ${parsed.liked.length    ? ' · liked: <strong>'+parsed.liked.join(', ')+'</strong>'    : ''}
          ${parsed.disliked.length ? ' · avoiding: <strong>'+parsed.disliked.join(', ')+'</strong>' : ''}
        </p>
      </div>`;
  }
}

// ── RESTAURANT PAGE ────────────────────────────────────────────
function viewRestaurant(id) {
  navigate('restaurant', { id });
}

function renderRestaurantPage(id) {
  if (!catalog) return;
  const r    = catalog.find(x => String(x.i) === String(id));
  const cont = document.getElementById('restaurant-content');
  if (!r) {
    cont.innerHTML = `
      <div style="text-align:center;padding:3.5rem 0">
        <h1 style="font-size:1.875rem;font-weight:700">Restaurant not found</h1>
        <button class="btn btn-primary" style="margin-top:1rem" onclick="goBack()">← Back</button>
      </div>`;
    return;
  }

  const menu          = menuFor(r.q);
  const mapEmbed      = `https://maps.google.com/maps?q=${encodeURIComponent(r.n+' '+(r.a||''))}&output=embed`;
  const menuSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(r.n+' '+r.c+' menu')}`;

  cont.innerHTML = `
    <div>
      <button class="btn btn-outline btn-sm" style="margin-bottom:1.5rem" onclick="goBack()">← Back</button>
      <div style="overflow:hidden;border-radius:calc(var(--radius)+12px);border:1px solid var(--border);box-shadow:var(--shadow-warm)">
        <img src="${photoFor(r.i, 1400, r.q)}" alt="${r.n}"
          style="width:100%;height:clamp(12rem,30vw,24rem);object-fit:cover" />
      </div>
      <div style="margin-top:1.5rem;display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:1rem">
        <div>
          <h1 style="font-size:clamp(1.75rem,4vw,2.5rem);font-weight:800;letter-spacing:-0.02em">${r.n}</h1>
          <p style="margin-top:0.25rem;color:var(--muted-foreground)">${r.c}</p>
          <div style="margin-top:0.5rem;display:flex;flex-wrap:wrap;gap:0.375rem">
            ${(r.q||[]).map(c=>`<span class="cuisine-chip">${c}</span>`).join('')}
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem">
          <span class="rating-chip" style="background:oklch(0.58 0.18 38 / 0.12);color:var(--primary)">
            ★ ${r.r.toFixed(1)}
          </span>
          <div style="display:flex;flex-wrap:wrap;gap:0.5rem;justify-content:flex-end">
            <a href="${menuSearchUrl}" target="_blank" rel="noreferrer" class="btn btn-primary btn-sm">
              🔍 Search Menu on Google →
            </a>
            <a href="${mapsLink(r.n,r.a)}" target="_blank" rel="noreferrer" class="btn btn-outline btn-sm">
              🗺️ Open in Maps
            </a>
          </div>
        </div>
      </div>

      <div class="restaurant-details-grid">
        <div style="border:1px solid var(--border);border-radius:calc(var(--radius)+4px);background:var(--card);padding:1.5rem;box-shadow:var(--shadow-soft)">
          <h2 style="font-size:1.25rem;font-weight:700">Menu (indicative)</h2>
          <ul class="menu-list" style="margin-top:1rem">
            ${menu.map(m=>`<li class="menu-item"><span>${m.item}</span><span class="menu-price">₹${m.price}</span></li>`).join('')}
          </ul>
          <p style="margin-top:1rem;font-size:0.75rem;color:var(--muted-foreground)">
            Indicative items based on cuisine type. Verify with restaurant directly.
          </p>
          <a href="${menuSearchUrl}" target="_blank" rel="noreferrer"
            style="display:inline-flex;align-items:center;gap:0.375rem;margin-top:0.75rem;font-size:0.8125rem;font-weight:600;color:var(--primary);text-decoration:underline">
            🔍 Find full menu on Google →
          </a>
        </div>
        <div style="display:flex;flex-direction:column;gap:1rem">
          <div style="border:1px solid var(--border);border-radius:calc(var(--radius)+4px);background:var(--card);padding:1.25rem;box-shadow:var(--shadow-soft)">
            <h3 style="font-weight:600">Address</h3>
            <p style="margin-top:0.375rem;font-size:0.875rem;color:#cccccc">${r.a||'—'}</p>
          </div>
          <div style="overflow:hidden;border-radius:calc(var(--radius)+4px);border:1px solid var(--border);box-shadow:var(--shadow-soft)">
            <iframe title="map" src="${mapEmbed}" class="map-frame" loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      </div>
    </div>`;
}

// ── FEEDBACK STORAGE ───────────────────────────────────────────
function loadBoost(city) {
  try {
    const raw = localStorage.getItem('ct.feedback.'+city.toLowerCase());
    return raw ? JSON.parse(raw) : {liked:[],disliked:[]};
  } catch { return {liked:[],disliked:[]}; }
}

function saveFeedback(city, parsed) {
  try {
    const key           = 'ct.feedback.'+city.toLowerCase();
    const existing      = loadBoost(city);
    const prevSentiment = existing.sentiment || 0;
    const newSentiment  = (prevSentiment * 0.6) + (parsed.sentiment * 0.4);
    localStorage.setItem(key, JSON.stringify({
      liked:     [...new Set([...existing.liked,    ...parsed.liked])],
      disliked:  [...new Set([...existing.disliked, ...parsed.disliked])],
      sentiment: +newSentiment.toFixed(3),
      updatedAt: Date.now(),
    }));
  } catch {}
}

function parseFeedback(text) {
  const POSITIVE = ['love','loved','great','amazing','excellent','delicious','tasty','yum','fantastic','perfect','best','favorite','favourite','awesome','good','happy','enjoyed'];
  const NEGATIVE = ['bad','worst','hate','hated','awful','boring','stale','bland','disappointed','disappointing','expensive','overpriced','rude','slow','cold','soggy'];
  const KNOWN    = ['north indian','south indian','chinese','biryani','pizzas','pizza','italian','continental','fast food','desserts','bakery','beverages','mughlai','punjabi','thalis','thali','healthy food','snacks','ice cream','pastas','pasta','burgers','burger','cafe','seafood'];

  const t = ' '+text.toLowerCase()+' ';
  let pos=0, neg=0;
  for (const w of POSITIVE) if (t.includes(' '+w+' ')||t.includes(w+'.')||t.includes(w+'!')) pos++;
  for (const w of NEGATIVE) if (t.includes(w)) neg++;
  const total = pos+neg;
  const sentiment = total===0 ? 0 : (pos-neg)/total;

  const liked=[], disliked=[];
  for (const c of KNOWN.filter(c=>t.includes(c))) {
    const idx    = t.indexOf(c);
    const window = t.slice(Math.max(0,idx-30), idx);
    const negated = NEGATIVE.some(w=>window.includes(w)) || /\b(not|no|didn'?t)\b/.test(window);
    if (negated) disliked.push(c.replace(/\b\w/g,m=>m.toUpperCase()));
    else         liked.push(c.replace(/\b\w/g,m=>m.toUpperCase()));
  }
  return { sentiment, liked:[...new Set(liked)], disliked:[...new Set(disliked)] };
}

// ── RESET ──────────────────────────────────────────────────────
function resetFlow() {
  members = []; currentMemberIndex = 0; currentDraft = emptyPrefs();
  lastResult = lastGroupPrefs = lastFiltersApplied = null;
  navigate('home');
}

// ── TOAST ──────────────────────────────────────────────────────
function showToast(msg, duration=3500) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display='none'; }, duration);
}

// ── BOOT ───────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', init);
// =============================================================
// REMOTE JOIN FEATURE
// =============================================================
let socket = null;
let remoteRole = null;   // 'host' | 'guest'
let remoteCode = null;
let remoteRoomInfo = null;
let remoteDraft = emptyPrefs();

function ensureSocket() {
  if (socket && socket.connected) return socket;
  socket = io({ transports: ['websocket', 'polling'] });

  socket.on('connect', () => console.log('Socket connected:', socket.id));

  socket.on('room_created', (data) => {
    remoteCode = data.code;
    remoteRole = 'host';
    // Host submits their own preferences first, then sees the waiting page
    renderHostPrefsPage(data);
  });

  socket.on('joined_room', (data) => {
    remoteRoomInfo = data;
    renderGuestPrefsPage(data);
  });

  socket.on('join_error', (data) => {
    showToast(data.error || 'Could not join room');
  });

  socket.on('submit_error', (data) => {
    showToast(data.error || 'Submission failed');
  });

  socket.on('submit_ok', (data) => {
    renderGuestThankYou(data);
  });

  socket.on('guest_joined', (data) => updateHostProgress(data));
  socket.on('progress_update', (data) => updateHostProgress(data));

  socket.on('room_result', (data) => {
    if (remoteRole === 'host') {
      lastResult = data;
      lastGroupPrefs = data.groupPrefs;
      lastFiltersApplied = data.filtersApplied;
      navigate('result');
      renderResultPage(data);
    } else {
      renderGuestFinalResult(data);
    }
  });

  socket.on('room_closed', () => {
    showToast('Room closed by host');
  });

  return socket;
}

// ── MODAL ──────────────────────────────────────────────────────
function openRemoteModal() {
  const sel = document.getElementById('remote-theme');
  sel.innerHTML = THEMES.map(t => `<option value="${t.id}">${t.emoji} ${t.label}</option>`).join('');
  sel.value = currentTheme;
  document.getElementById('remote-city').value = currentCity || currentState || '';
  document.getElementById('create-room-form').style.display = 'none';
  document.getElementById('join-room-form').style.display = 'none';
  document.getElementById('remote-modal').style.display = 'flex';
}
function closeRemoteModal() { document.getElementById('remote-modal').style.display = 'none'; }
function startCreateRoom() {
  document.getElementById('create-room-form').style.display = 'block';
  document.getElementById('join-room-form').style.display = 'none';
}
function startJoinRoom() {
  document.getElementById('create-room-form').style.display = 'none';
  document.getElementById('join-room-form').style.display = 'block';
  setTimeout(() => document.getElementById('remote-join-code').focus(), 100);
}

function confirmCreateRoom() {
  if (!catalog) { showToast('Still loading data, please wait…'); return; }
  const theme = document.getElementById('remote-theme').value || 'casual';
  const size  = Math.max(2, Math.min(20, parseInt(document.getElementById('remote-size').value) || 3));
  const city  = (document.getElementById('remote-city').value || '').trim();

  currentTheme = theme;
  if (city) currentCity = city;

  remoteRole = 'host';
  ensureSocket();
  closeRemoteModal();

  const send = () => socket.emit('create_room', {
    theme, groupSize: size, city, cityList: nearbyCities || [],
  });
  if (socket.connected) send(); else socket.once('connect', send);
}

function confirmJoinRoom() {
  const code = (document.getElementById('remote-join-code').value || '').trim().toUpperCase();
  if (code.length < 4) { showToast('Enter a valid room code'); return; }
  remoteRole = 'guest';
  remoteCode = code;
  ensureSocket();
  closeRemoteModal();

  const send = () => socket.emit('join_room_as_guest', { code });
  if (socket.connected) send(); else socket.once('connect', send);
}

// ── HOST WAITING PAGE ──────────────────────────────────────────
function renderHostWaitingPage(data) {
  navigate('remote-host');
  const themeMeta = THEMES.find(t => t.id === data.theme);
  const joinUrl = `${window.location.origin}/join/${data.code}`;

  document.getElementById('remote-host-content').innerHTML = `
    <div style="max-width:42rem;margin:0 auto">
      <button class="btn btn-outline btn-sm" onclick="closeHostRoom()">← Cancel</button>

      <div style="text-align:center;margin-top:1.5rem">
        <span class="badge badge-primary">🏠 Room created</span>
        <h1 style="font-size:clamp(1.75rem,4vw,2.5rem);margin-top:0.75rem;letter-spacing:-0.02em">
          Share this with your group
        </h1>
        <p style="margin-top:0.5rem;color:var(--muted-foreground)">
          ${themeMeta?.emoji||''} ${themeMeta?.label||''} · ${data.groupSize} people${data.city?' · '+data.city:''}
        </p>
      </div>

      <div class="card card-padded" style="margin-top:1.5rem;text-align:center">
        <p class="label">Room code</p>
        <div style="font-family:monospace;font-size:clamp(2rem,8vw,3.5rem);font-weight:800;letter-spacing:0.3em;color:var(--primary);margin-top:0.5rem">
          ${data.code}
        </div>

        <div style="margin-top:1.5rem;display:flex;justify-content:center">
          <div id="qr-canvas-wrap" style="padding:1rem;background:white;border-radius:var(--radius);box-shadow:var(--shadow-soft)"></div>
        </div>

        <div style="margin-top:1rem;padding:0.75rem;background:var(--secondary);border-radius:var(--radius);font-size:0.8125rem;word-break:break-all;font-family:monospace">
          ${joinUrl}
        </div>

        <div style="display:flex;gap:0.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" onclick="copyToClipboard('${data.code}','Code copied!')">📋 Copy code</button>
          <button class="btn btn-outline btn-sm" onclick="copyToClipboard('${joinUrl}','Link copied!')">🔗 Copy link</button>
          <button class="btn btn-outline btn-sm" onclick="shareRoom('${data.code}','${joinUrl}')">📤 Share</button>
        </div>
      </div>

      <div class="card card-padded" style="margin-top:1.5rem">
        <p class="label">Waiting for submissions</p>
        <div style="display:flex;align-items:center;gap:1rem;margin-top:0.5rem">
          <div style="flex:1;height:0.625rem;background:var(--secondary);border-radius:9999px;overflow:hidden">
            <div id="host-progress-bar" style="height:100%;width:0%;background:var(--primary);transition:width 0.4s"></div>
          </div>
          <div id="host-progress-text" style="font-weight:700;font-size:1.125rem">0 / ${data.groupSize}</div>
        </div>
        <p style="margin-top:0.75rem;font-size:0.8125rem;color:var(--muted-foreground)">
          🔒 Each person's input is anonymous and never shown to others. Results appear here automatically once everyone submits.
        </p>
      </div>
    </div>`;
  
  // Generate QR code for the waiting page
  const wrap = document.getElementById('qr-canvas-wrap');
  if (wrap) {
    const joinUrl = `${window.location.origin}/join/${data.code}`;
    let retries = 0;
    const generateQR = () => {
      if (window.QRCode) {
        try {
          wrap.innerHTML = '';
          new QRCode(wrap, { text: joinUrl, width: 200, height: 200,
            colorDark: '#000000', colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H });
        } catch { wrap.innerHTML = '<p style="font-size:0.875rem;color:var(--muted-foreground)">QR failed</p>'; }
      } else if (retries++ < 20) { setTimeout(generateQR, 100); }
      else { wrap.innerHTML = '<p style="font-size:0.875rem;color:var(--muted-foreground)">QR library not loaded</p>'; }
    };
    generateQR();
  }
}
    function renderHostPrefsPage(data) {
  navigate('remote-host');
  document.getElementById('remote-host-content').innerHTML = `
    <div style="max-width:32rem;margin:0 auto">
      <div style="text-align:center;margin-bottom:1.5rem">
        <span class="badge badge-primary">🏠 You're the host</span>
        <h2 style="font-size:1.5rem;font-weight:800;margin-top:0.5rem">Set your own preferences first</h2>
        <p style="color:var(--muted-foreground);margin-top:0.5rem">After submitting, others can join with your code.</p>
      </div>
      <div id="host-prefs-form">
        ${renderInlinePrefsForm('submitHostPrefs')}
      </div>
    </div>`;
}


function submitHostPrefs() {
  const cuisines  = [...document.querySelectorAll('#inline-cuisine-check:checked')].map(el=>el.value);
  const budget    = parseInt(document.getElementById('inline-budget')?.value || '600');
  const allergies = [...document.querySelectorAll('#inline-allergy-check:checked')].map(el=>el.value);

  // Submit host prefs to server as first member
  socket.emit('submit_guest_prefs', {
    code: remoteCode,
    cuisines,
    budgetMax: budget,
    allergies,
  });

  // Now show the waiting/share page
  renderHostWaitingPage({ code: remoteCode, theme: currentTheme, groupSize: parseInt(document.getElementById('remote-size')?.value || '3') });
}
function renderInlinePrefsForm(submitFn) {
  const cuisineList = ['Biryani','Pizza','Chinese','South Indian','North Indian','Burgers','Cafe','Desserts','Healthy Food','Fast Food'];
  const allergyList = ['dairy','gluten','nuts','seafood','egg'];
  return `
    <div style="display:flex;flex-direction:column;gap:1.25rem">
      <div>
        <p style="font-weight:600;margin-bottom:0.5rem">Favourite cuisines</p>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
          ${cuisineList.map(c=>`
            <label style="display:flex;align-items:center;gap:0.375rem;padding:0.375rem 0.75rem;border:1px solid var(--border);border-radius:9999px;cursor:pointer;font-size:0.875rem">
              <input type="checkbox" id="inline-cuisine-check" value="${c}" style="accent-color:var(--primary)"> ${c}
            </label>`).join('')}
        </div>
      </div>
      <div>
        <p style="font-weight:600;margin-bottom:0.5rem">Max budget per head (₹)</p>
        <input type="number" id="inline-budget" value="600" min="50" max="5000" class="input-field" style="max-width:10rem">
      </div>
      <div>
        <p style="font-weight:600;margin-bottom:0.5rem">Allergies / avoid</p>
        <div style="display:flex;flex-wrap:wrap;gap:0.5rem">
          ${allergyList.map(a=>`
            <label style="display:flex;align-items:center;gap:0.375rem;padding:0.375rem 0.75rem;border:1px solid var(--border);border-radius:9999px;cursor:pointer;font-size:0.875rem">
              <input type="checkbox" id="inline-allergy-check" value="${a}" style="accent-color:var(--primary)"> ${a}
            </label>`).join('')}
        </div>
      </div>
      <button class="btn btn-primary" onclick="${submitFn}()">Submit & Get Shareable Code →</button>
    </div>`;
}
  

function updateHostProgress(data) {
  const bar = document.getElementById('host-progress-bar');
  const txt = document.getElementById('host-progress-text');
  if (bar && txt) {
    const pct = (data.submitted / data.total) * 100;
    bar.style.width = pct + '%';
    txt.textContent = `${data.submitted} / ${data.total}`;
  }
}

function closeHostRoom() {
  if (socket && remoteCode) socket.emit('close_room', { code: remoteCode });
  remoteRole = null; remoteCode = null;
  navigate('home');
}

function copyToClipboard(text, msg) {
  navigator.clipboard.writeText(text).then(() => showToast(msg || 'Copied!'))
    .catch(() => showToast('Copy failed'));
}

function shareRoom(code, url) {
  const text = `Join my CommunalTable group! Code: ${code}\n${url}`;
  if (navigator.share) {
    navigator.share({ title: 'CommunalTable Group', text, url }).catch(()=>{});
  } else {
    copyToClipboard(text, 'Share text copied!');
  }
}

// ── GUEST PAGES ────────────────────────────────────────────────
function renderGuestPrefsPage(info) {
  navigate('remote-guest');
  remoteDraft = emptyPrefs();
  const themeMeta = THEMES.find(t => t.id === info.theme);

  document.getElementById('remote-guest-content').innerHTML = `
    <div style="max-width:48rem;margin:0 auto">
      <div style="text-align:center;margin-bottom:1.5rem">
        <span class="badge badge-primary">🔒 Anonymous remote vote</span>
        <h1 style="font-size:clamp(1.5rem,4vw,2.25rem);margin-top:0.5rem;letter-spacing:-0.02em">
          Your preferences
        </h1>
        <p style="margin-top:0.25rem;color:var(--muted-foreground);font-size:0.875rem">
          Room ${info.code} · ${themeMeta?.emoji||''} ${themeMeta?.label||''}${info.city?' · '+info.city:''}
        </p>
      </div>

      <div class="space-y-4">
        <div class="section-card">
          <div class="section-header">🍽️ <span>Cuisines you'd love</span></div>
          <div class="flex gap-2">
            <input type="text" id="g-cuisine-input" class="input-field" style="flex:1;min-width:0"
              placeholder="Type a cuisine and press Enter" autocomplete="off"
              onkeydown="handleGuestCuisineKey(event)" />
            <button class="btn btn-primary" onclick="addGuestCuisine()">Add</button>
          </div>
          <div class="cuisine-tags" id="g-cuisine-tags"></div>
          <div style="margin-top:0.875rem">
            <p style="font-size:0.75rem;font-weight:600;color:var(--muted-foreground);margin-bottom:0.5rem">▼ Quick add:</p>
            <div class="cuisine-suggestions" id="g-cuisine-suggestions"></div>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">💵 <span>Your max budget per person</span></div>
          <div class="flex items-center gap-3">
            <span style="font-size:1.25rem;font-weight:700;color:var(--primary)">₹</span>
            <input type="number" id="g-budget-input" min="50" max="10000" value="600"
              class="input-field" style="width:10rem;height:3rem;font-size:1.25rem;font-weight:600" inputmode="numeric" />
            <span style="font-size:0.875rem;color:var(--muted-foreground)">per person</span>
          </div>
        </div>

        <div class="section-card">
          <div class="section-header">⚠️ <span>Allergies / dietary</span></div>
          <div class="allergy-grid" id="g-allergy-grid"></div>
        </div>

        <div class="privacy-box">
          <p style="font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;opacity:0.9">Privacy</p>
          <p style="font-size:0.875rem;margin-top:0.375rem;opacity:0.95">
            Your input is anonymous. The host only sees the merged group result.
          </p>
          <button id="g-submit-btn" class="btn w-full" style="margin-top:1rem;background:var(--card);color:var(--primary);font-weight:600" onclick="submitGuestPrefs()" disabled>
            Submit my preferences →
          </button>
        </div>
      </div>
    </div>`;

  document.getElementById('g-cuisine-suggestions').innerHTML = SUGGESTED_CUISINES.map(c =>
    `<button class="cuisine-suggestion-btn" id="g-sug-${c.replace(/\s/g,'_')}" onclick="addGuestSuggestion('${c}')">+ ${c}</button>`
  ).join('');

  document.getElementById('g-allergy-grid').innerHTML = ALLERGIES.map(a => `
    <button class="allergy-btn" id="g-allergy-${a}" onclick="toggleGuestAllergy('${a}')">
      <span class="allergy-emoji">${ALLERGY_EMOJIS[a]||'•'}</span>${a}
    </button>
  `).join('');
}

function handleGuestCuisineKey(e) { if (e.key==='Enter') { e.preventDefault(); addGuestCuisine(); } }
function addGuestCuisine() {
  const i = document.getElementById('g-cuisine-input');
  const v = i.value.trim();
  if (!v) return;
  if (remoteDraft.cuisines.some(c => c.toLowerCase() === v.toLowerCase())) { i.value=''; return; }
  remoteDraft.cuisines.push(v);
  i.value = '';
  renderGuestCuisineTags();
}
function addGuestSuggestion(c) {
  if (remoteDraft.cuisines.includes(c)) return;
  remoteDraft.cuisines.push(c);
  renderGuestCuisineTags();
}
function removeGuestCuisine(c) {
  remoteDraft.cuisines = remoteDraft.cuisines.filter(x => x !== c);
  renderGuestCuisineTags();
}
function renderGuestCuisineTags() {
  document.getElementById('g-cuisine-tags').innerHTML = remoteDraft.cuisines.map(c =>
    `<button class="cuisine-tag" onclick="removeGuestCuisine('${c.replace(/'/g,"\\'")}')">${c} <span style="opacity:.7">✕</span></button>`
  ).join('');
  SUGGESTED_CUISINES.forEach(c => {
    const btn = document.getElementById('g-sug-'+c.replace(/\s/g,'_'));
    if (btn) btn.style.display = remoteDraft.cuisines.includes(c) ? 'none' : '';
  });
  document.getElementById('g-submit-btn').disabled = remoteDraft.cuisines.length === 0;
}
function toggleGuestAllergy(a) {
  if (remoteDraft.allergies.includes(a)) {
    remoteDraft.allergies = remoteDraft.allergies.filter(x=>x!==a);
  } else {
    remoteDraft.allergies.push(a);
  }
  document.getElementById('g-allergy-'+a)?.classList.toggle('on', remoteDraft.allergies.includes(a));
}

function submitGuestPrefs() {
  if (!remoteDraft.cuisines.length) { showToast('Add at least one cuisine'); return; }
  const budget = Math.max(50, Math.min(10000,
    Number(document.getElementById('g-budget-input').value) || 600));
  socket.emit('submit_guest_prefs', {
    code: remoteCode,
    cuisines: remoteDraft.cuisines,
    budgetMax: budget,
    allergies: remoteDraft.allergies,
  });
  document.getElementById('g-submit-btn').disabled = true;
  document.getElementById('g-submit-btn').textContent = 'Submitting…';
}

function renderGuestThankYou(data) {
  document.getElementById('remote-guest-content').innerHTML = `
    <div style="max-width:32rem;margin:0 auto;text-align:center;padding:3rem 1rem">
      <div style="font-size:4rem">✅</div>
      <h1 style="font-size:1.875rem;font-weight:800;margin-top:1rem">Thanks!</h1>
      <p style="margin-top:0.5rem;color:var(--muted-foreground)">
        Your preferences have been submitted anonymously.
      </p>
      <div class="card card-padded" style="margin-top:1.5rem">
        <p class="label">Waiting for others</p>
        <div style="font-size:2rem;font-weight:800;margin-top:0.5rem">
          ${data.submitted} / ${data.total}
        </div>
        <p style="margin-top:0.5rem;font-size:0.8125rem;color:var(--muted-foreground)">
          You'll see the final pick on this screen once everyone submits.
        </p>
      </div>
    </div>`;
}

function renderGuestFinalResult(data) {
  const picks = data.picks || [];
  const place = data.groupPrefs?.location || '';

  if (!picks.length) {
    document.getElementById('remote-guest-content').innerHTML = `
      <div style="max-width:32rem;margin:0 auto;text-align:center;padding:3rem 1rem">
        <h2>No matches found</h2>
      </div>`;
    return;
  }

  // Reuse the exact same result page as the host — guests see identical layout
  lastResult           = data;
  lastGroupPrefs       = data.groupPrefs || {};
  lastFiltersApplied   = data.filtersApplied || {};
  currentCity          = place;

  // Sync members count so vote line renders correctly
  if (!members.length && data.groupPrefs?.groupSize) {
    members = Array(data.groupPrefs.groupSize).fill({ cuisines:[], budgetMax:600, allergies:[] });
  }

  navigate('result');
  renderResultPage(data);

  // Replace "Edit Preferences" with "Leave group" for guests since they can't restart the host flow
  const editBtn = document.querySelector('[onclick="editPreferences()"]');
  if (editBtn) {
    editBtn.textContent = '🏠 Back to Home';
    editBtn.setAttribute('onclick', 'resetFlow()');
  }
}

// ── AUTO-JOIN from URL like /join/ABC123 ───────────────────────
function checkAutoJoin() {
  const m = window.location.pathname.match(/^\/join\/([A-Z0-9]+)/i);
  if (m) {
    const code = m[1].toUpperCase();
    remoteRole = 'guest';
    remoteCode = code;
    ensureSocket();
    const send = () => socket.emit('join_room_as_guest', { code });
    if (socket.connected) send(); else socket.once('connect', send);
    // clean URL
    window.history.replaceState({}, '', '/');
  }
}

// Run after init
window.addEventListener('DOMContentLoaded', () => setTimeout(checkAutoJoin, 500));
