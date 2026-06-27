document.addEventListener("DOMContentLoaded", function () {

  // ================= GRADES =================
  const grades = [
    "Grade 1","Grade 2","Grade 3","Grade 4","Grade 5",
    "Grade 6","Grade 7","Grade 8",
    "Algebra 1","Geometry","Algebra 2","Precalc/Calc"
  ];

  // ================= CURRICULUM =================
  const curriculum = {
    "Grade 1": ["Addition","Subtraction"],
    "Grade 2": ["Two-digit Addition","Two-digit Subtraction"],
    "Grade 3": ["Multiplication","Division"],
    "Grade 4": ["Multi-digit Multiplication"],
    "Grade 5": ["Fractions"],
    "Grade 6": ["Ratios"],
    "Grade 7": ["Algebra Basics"],
    "Grade 8": ["Linear Equations"],
    "Algebra 1": ["Expressions","Functions"],
    "Geometry": ["Shapes","Angles","Area & Perimeter"],
    "Algebra 2": ["Advanced Algebra"],
    "Precalc/Calc": ["Trig"]
  };

  // ================= HELPERS =================
  const el = (id) => document.getElementById(id);

  function rand(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function makeBank(generator){
    return Array.from({length: 70}, generator);
  }

  // ================= QUESTION BANK =================
  const questionBank = {

    // ARITHMETIC
    "Addition": makeBank(() => {
      let a = rand(1,20), b = rand(1,20);
      return { q: `${a} + ${b}`, a: a + b };
    }),

    "Subtraction": makeBank(() => {
      let a = rand(10,30), b = rand(1,10);
      return { q: `${a} - ${b}`, a: a - b };
    }),

    "Multiplication": makeBank(() => {
      let a = rand(1,12), b = rand(1,12);
      return { q: `${a} × ${b}`, a: a * b };
    }),

    "Division": makeBank(() => {
      let b = rand(1,12);
      let a = b * rand(1,12);
      return { q: `${a} ÷ ${b}`, a: a / b };
    }),

    "Two-digit Addition": makeBank(() => {
      let a = rand(10,99), b = rand(10,99);
      return { q: `${a} + ${b}`, a: a + b };
    }),

    "Two-digit Subtraction": makeBank(() => {
      let a = rand(50,99), b = rand(10,49);
      return { q: `${a} - ${b}`, a: a - b };
    }),

    "Fractions": makeBank(() => {
      let a = rand(1,9), b = rand(1,9);
      return { q: `${a}/${b} + ${a}/${b}`, a: (2*a)/b };
    }),

    "Ratios": makeBank(() => {
      let a = rand(1,10), b = rand(1,10);
      return { q: `${a}:${b} simplify`, a: `${a}:${b}` };
    }),

    // ALGEBRA
    "Expressions": makeBank(() => {
      let x = 2, a = rand(1,10);
      return { q: `${a}x when x=2`, a: a * x };
    }),

    "Functions": makeBank(() => {
      let x = rand(1,10);
      return { q: `f(x)=x+3, x=${x}`, a: x + 3 };
    }),

    "Algebra Basics": makeBank(() => {
      return { q: `x + 5 = 12`, a: 7 };
    }),

    "Linear Equations": makeBank(() => {
      return { q: `x + 3 = 10`, a: 7 };
    }),

    "Advanced Algebra": makeBank(() => {
      return { q: `2x = 10`, a: 5 };
    }),

    "Trig": makeBank(() => {
      return { q: `sin(30°)`, a: 0.5 };
    }),

    // GEOMETRY
    "Shapes": makeBank(() => {
      return { q: `How many sides does a triangle have?`, a: 3 };
    }),

    "Angles": makeBank(() => {
      let a = rand(30,150);
      return { q: `Supplement of ${a}?`, a: 180 - a };
    }),

    "Area & Perimeter": makeBank(() => {
      let l = rand(2,10), w = rand(2,10);
      return { q: `Area of ${l}×${w}`, a: l * w };
    })
  };

  // ================= STATE =================
  let user = null;
  let currentGrade = "Grade 1";
  let skillXP = {};
  let currentSkill = null;
  let currentQ = null;

  // ================= ELEMENTS =================
  const home = el("home"),
        auth = el("auth"),
        dashboard = el("dashboard"),
        practiceSection = el("practiceSection"),
        cfuSection = el("cfuSection"),
        guestDashboard = el("guestDashboard");

  const homeBtn = el("homeBtn"),
        loginBtn = el("loginBtn"),
        registerBtn = el("registerBtn"),
        guestBtn = el("guestBtn"),
        authTitle = el("authTitle"),
        authSubmit = el("authSubmit"),
        username = el("username"),
        password = el("password"),
        gradeTitle = el("gradeTitle"),
        skills = el("skills"),
        cfuBtn = el("cfuBtn");

  // ================= NAV =================
  function hideAll(){
    [home,auth,dashboard,practiceSection,cfuSection,guestDashboard]
      .forEach(s => s && s.classList.add("hidden"));
  }

  function show(s){
    hideAll();
    s.classList.remove("hidden");
  }

  show(home);

  // ================= AUTH =================
  function register(){
    if (!username.value || !password.value) return alert("Fill all fields");

    if (localStorage.getItem(username.value))
      return alert("User exists");

    localStorage.setItem(username.value, JSON.stringify({
      password: password.value,
      grade: "Grade 1",
      xp: {}
    }));

    alert("Registered!");
  }

  function login(){
    let data = JSON.parse(localStorage.getItem(username.value));

    if (!data || data.password !== password.value)
      return alert("Wrong login");

    user = username.value;
    skillXP = data.xp || {};

    loadGrade(data.grade);
  }

  homeBtn.onclick = () => show(home);

  loginBtn.onclick = () => {
    show(auth);
    authTitle.innerText = "Login";
    authSubmit.onclick = login;
  };

  registerBtn.onclick = () => {
    show(auth);
    authTitle.innerText = "Register";
    authSubmit.onclick = register;
  };

  guestBtn.onclick = () => {
    show(guestDashboard);
    guestDashboard.innerHTML = "<h2>Select Grade</h2>";

    grades.forEach(g => {
      const btn = document.createElement("button");
      btn.innerText = g;
      btn.onclick = () => loadGrade(g);
      guestDashboard.appendChild(btn);
    });
  };

  // ================= LOAD GRADE =================
  function loadGrade(g){
    currentGrade = g;
    show(dashboard);

    gradeTitle.innerText = g;
    skills.innerHTML = "";

    let data = user ? JSON.parse(localStorage.getItem(user)) : {xp:{}};
    skillXP = data.xp || {};

    curriculum[g].forEach(skill => {
      const div = document.createElement("div");

      div.innerHTML = `
        <h3>${skill}</h3>
        <p>${skillXP[skill] || 0} XP</p>
        <button class="practiceBtn">Practice</button>
      `;

      div.querySelector(".practiceBtn").onclick = () => openPractice(skill);

      skills.appendChild(div);
    });

    const done = curriculum[g].every(s => (skillXP[s] || 0) >= 300);
    cfuBtn.style.display = done ? "inline-block" : "none";
  }

  // ================= PRACTICE (FIXED BUTTON SYSTEM) =================
  function openPractice(skill){
    show(practiceSection);
    currentSkill = skill;

    practiceSection.innerHTML = `
      <h2>${skill}</h2>

      <p>XP: <span id="xp"></span></p>

      <h3 id="question"></h3>
      <input id="answer" type="number">

      <button id="submitBtn">Submit</button>
      <button id="explainBtn" disabled>Explain</button>

      <div id="feedback"></div>
      <button id="backBtn">Back</button>
    `;

    const bank = questionBank[skill] || [{q:"No questions",a:0}];

    function next(){
      currentQ = bank[rand(0, bank.length - 1)];

      el("question").innerText = currentQ.q;
      el("answer").value = "";
      el("feedback").innerText = "";
      el("explainBtn").disabled = true;
      el("xp").innerText = skillXP[skill] || 0;
    }

    function save(){
      if (!user) return;
      let data = JSON.parse(localStorage.getItem(user));
      data.xp = skillXP;
      localStorage.setItem(user, JSON.stringify(data));
    }

    // IMPORTANT: re-bind AFTER DOM creation
    el("submitBtn").onclick = () => {
      let val = parseFloat(el("answer").value);

      if (val === currentQ.a){
        skillXP[skill] = Math.min((skillXP[skill]||0)+10,300);
        el("feedback").innerText = "Correct!";
        save();
        setTimeout(next, 600);
      } else {
        skillXP[skill] = Math.max((skillXP[skill]||0)-1,0);
        el("feedback").innerText = "Wrong";
        el("explainBtn").disabled = false;
        save();
      }
    };

    el("explainBtn").onclick = () => {
      el("feedback").innerText = "Answer: " + currentQ.a;
    };

    el("backBtn").onclick = () => loadGrade(currentGrade);

    next();
  }

  // ================= CFU =================
  cfuBtn.onclick = () => {
    show(cfuSection);

    const list = curriculum[currentGrade].slice(0,3);

    cfuSection.innerHTML = `
      <h2>CFU</h2>
      <div id="box"></div>
      <button id="submitCFU">Submit</button>
      <div id="fb"></div>
    `;

    const box = el("box");

    list.forEach((s,i)=>{
      box.innerHTML += `<input id="c${i}" type="number" placeholder="${s}"><br>`;
    });

    el("submitCFU").onclick = () => {
      let correct = 0;

      list.forEach((s,i)=>{
        let v = parseFloat(el("c"+i).value);
        if (!isNaN(v)) correct++;
      });

      if (correct >= 2){
        let data = JSON.parse(localStorage.getItem(user));
        data.grade = grades[grades.indexOf(currentGrade)+1] || currentGrade;

        localStorage.setItem(user, JSON.stringify(data));

        alert("CFU Passed!");
        loadGrade(data.grade);
      } else {
        el("fb").innerText = "Try again";
      }
    };
  };

});