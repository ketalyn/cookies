const SUPABASE_URL = 'https://tqlrdwulgedhsdxknqba.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxbHJkd3VsZ2VkaHNkeGtucWJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUzNzY3MTQsImV4cCI6MjA2MDk1MjcxNH0.vArUSuyeAYUAg9D9tz5wNSAAqJ_PLJ25r9GSjVxCCLM';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const container = document.getElementById('letter-container');
const field = document.getElementById('letter-field');
let offsetX = 0, offsetY = 0;

function createTile(char, x, y, isMessageLetter = false) {
  const tile = document.createElement('div');
  tile.classList.add('letter-tile');
  tile.textContent = char;
  tile.style.left = `${x}px`;
  tile.style.top = `${y}px`;
  if (isMessageLetter) tile.dataset.message = "true";
  field.appendChild(tile);
}

function renderFloatingLetters(message) {
  field.innerHTML = '';
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ';
  const totalDecoys = 8000;
  const fieldWidth = 4000;
  const fieldHeight = 4000;

  for (let i = 0; i < totalDecoys; i++) {
    const char = allLetters[Math.floor(Math.random() * allLetters.length)];
    const x = Math.random() * fieldWidth;
    const y = Math.random() * fieldHeight;
    createTile(char, x, y);
  }

  const words = message.toUpperCase().replace(/[^A-Z ]/g, '').split(' ');
  const spacing = 30;
  const maxLineWidth = 10 * spacing;
  const startX = Math.random() * (fieldWidth - 300);
  const startY = Math.random() * (fieldHeight - 300);
  let cursorX = startX;
  let cursorY = startY;

  let maxRowWidth = 0;
  let rows = 1;

  words.forEach((word, wordIndex) => {
    const wordLength = word.length * spacing;
    if (cursorX + wordLength > startX + maxLineWidth) {
      cursorX = startX;
      cursorY += spacing;
      rows++;
    }

    word.split('').forEach(char => {
      createTile(char, cursorX, cursorY, true);
      cursorX += spacing;
    });

    cursorX += spacing;

    maxRowWidth = Math.max(maxRowWidth, cursorX - startX);
  });

  field.dataset.messageX = startX + maxRowWidth / 2;
  field.dataset.messageY = startY + (rows * spacing) / 2;
}

document.getElementById('instructions-trigger').addEventListener('click', () => {
  document.getElementById('instructions-popup').classList.remove('hidden');
});

function revealMessage(message) {
  const messageLetters = message.toUpperCase().replace(/[^A-Z]/g, '').split('');
  const allTiles = Array.from(document.querySelectorAll('.letter-tile'));
  allTiles.forEach(tile => tile.classList.remove('reveal'));

  let msgIndex = 0;
  for (let tile of allTiles) {
    if (tile.dataset.message === "true" && tile.textContent === messageLetters[msgIndex]) {
      tile.classList.add('reveal');
      msgIndex++;
      if (msgIndex >= messageLetters.length) break;
    }
  }

  const messageX = parseFloat(field.dataset.messageX);
  const messageY = parseFloat(field.dataset.messageY);
  offsetX = container.offsetWidth / 2 - messageX;
  offsetY = container.offsetHeight / 2 - messageY;
  field.style.transition = 'transform 0.6s ease';
  field.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  setTimeout(() => field.style.transition = '', 600);
}

document.addEventListener('DOMContentLoaded', async () => {
  const { data, error } = await supabase.from('cookies').select('*');
  if (error || !data || data.length === 0) {
    container.innerText = "Oops! Couldn't load a cookie.";
    return;
  }
  renderFloatingLetters(data[Math.floor(Math.random() * data.length)].message);
  loadMessageButtons();
});

async function loadMessageButtons() {
  const { data, error } = await supabase.from('cookies').select('id, password, message, tier');
  if (error) {
    console.error("Failed to load message buttons:", error);
    return;
  }
  
  const container = document.getElementById("message-buttons");
  container.innerHTML = '';
  
  data.forEach(entry => {
    const wrapper = document.createElement('div');
    wrapper.classList.add('locked-msg');
    wrapper.dataset.tier = entry.tier;
  
    if (!entry.password) {
      const btn = document.createElement('button');
      btn.textContent = 'Unlocked Message';
      btn.classList.add('unlocked-btn');
      btn.dataset.id = entry.id;
  
      btn.addEventListener('click', async () => {
        const { data, error } = await supabase
          .from('cookies')
          .select('message')
          .eq('id', entry.id)
          .single();
  
        if (error || !data) {
          alert("Error fetching message.");
          return;
        }
  
        renderFloatingLetters(data.message);
        setTimeout(() => revealMessage(data.message), 0);
      });
  
      wrapper.appendChild(btn);
      container.appendChild(wrapper);
      return;
    }
  
    const lockBtn = document.createElement('button');
    lockBtn.textContent = '🔒';
    lockBtn.dataset.id = entry.id;
  
    const input = document.createElement('input');
    input.type = 'password';
    input.placeholder = 'Enter password';
    input.classList.add('password-input');
    input.style.display = 'none';
  
    const unlockBtn = document.createElement('button');
    unlockBtn.classList.add('unlock-btn');    
    unlockBtn.textContent = 'Unlock';
    unlockBtn.style.display = 'none';
  
    lockBtn.addEventListener('click', () => {
      lockBtn.style.display = 'none';
      input.style.display = 'inline-block';
      unlockBtn.style.display = 'inline-block';

      input.classList.add('expanded');
    });
  
    unlockBtn.addEventListener('click', async () => {
      const { data, error } = await supabase
        .from('cookies')
        .select('message, password')
        .eq('id', entry.id)
        .single();
  
      if (error || !data) {
        alert("Error fetching message.");
        return;
      }
  
      if (input.value.trim() === (data.password || '').trim()) {
        renderFloatingLetters(data.message);
        setTimeout(() => revealMessage(data.message), 0);
      } else {
        alert("Incorrect password.");
      }
    });
  
    const formWrapper = document.createElement('div');
    formWrapper.classList.add('unlock-form');
    
    formWrapper.appendChild(input);
    formWrapper.appendChild(unlockBtn);
    
    wrapper.appendChild(lockBtn);
    wrapper.appendChild(formWrapper);
    container.appendChild(wrapper);    
  });  
}

let isDragging = false, startX, startY;

document.getElementById('question-trigger').addEventListener('click', () => {
  document.getElementById('question-popup').classList.remove('hidden');
});

document.querySelectorAll('#question-popup button').forEach(btn => {
  btn.addEventListener('click', () => {
    const selectedTier = btn.dataset.tier;

    document.querySelectorAll('#message-buttons .locked-msg').forEach(msg => {
      const msgTier = msg.dataset.tier;
      msg.classList.toggle('highlight', msgTier === selectedTier);
    });

    const highlighted = document.querySelector('.locked-msg.highlight');
if (highlighted) {
  highlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

const highlightedMessages = document.querySelectorAll('.locked-msg.highlight');
if (highlightedMessages.length > 0) {
  highlightedMessages[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
}

    document.getElementById('question-popup').classList.add('hidden');
  });
});

const questions = {
  step1: {
    title: "When did you meet Katelyn?",
    options: [
      { text: "Before college", next: "beforeCollege" },
      { text: "During college", next: "duringCollege" },
      { text: "I've never met her", next: "neverMet" }
    ]
  },

  beforeCollege: {
    title: "Where did you meet Katelyn?",
    options: [
      { text: "Family member/since birth", next: "familyMember" },
      { text: "Robert C. Fisler", next: "robertCfisler" },
      { text: "High School", next: "highSchool" },
      { text: "Church", next: "church" }
    ]
  },

  familyMember: {
    title: "Relation to Katelyn?",
    options: [
      { text: "Sibling", next: "sibling"},
      { text: "Parent", next: "parent"},
      { text: "Grandparent", next: "grandParent"}
    ]
  },

  sibling: {
    title: "Who are you?",
    options: [
      { text: "Chloe", next: "chloeQuestion"},
      { text: "Connor", next: "connorQuestion"}
    ]
  },

  chloeQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What coffee shop with a cat doodle logo located in Anaheim do I like to take you to?", tier: "chloe"}
    ]
  },

  connorQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What type of bird do I like to call you as a nickname?", tier: "connor"}
    ]
  },

  parent: {
    title: "Who are you?",
    options: [
      { text: "Mom", next: "momQuestion"},
      { text: "Dad", next: "dadQuestion"}
    ]
  },

  momQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "Where did I take my driver's license Test?", tier: "mom"}
    ]
  },

  dadQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "Which mall parking lot did I crash your car in the first time I drove?", tier: "dad"}
    ]
  },

  grandParent: {
    title: "Who are you?",
    options: [
      { text: "할머니", tier: "할머니"},
      { text: "외할머니", tier: "외할머니"}
    ]
  },

  robertCfisler: {
    title: "What letter does your name start with?",
    options: [
      { text: "E", next: "elizabethQuestion"},
      { text: "L", next: "laurenQuestion"},
      { text: "S", next: "sandyQuestion"}
    ]
  },

  elizabethQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What station would we get on the Metrolink to go to highschool?", tier: "liz"}
    ]
  },

  laurenQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What orange caffeinated drink did I apparently introduce you to?", tier: "lauren"}
    ]
  },

  sandyQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What is the name of my sponsor who I have not talked to in forever?", tier: "sandy"}
    ]
  },

  highSchool: {
    title: "What letter does your name start with?",
    options: [
      { text: "C", next: "carrieQuestion"},
      { text: "E", next: "elizabethQuestion"},
      { text: "L", next: "laurenQuestion"},
    ]
  },

  carrieQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What was the name of the 7 floor building that everyone hated taking the stairs for?", tier: "carrie"}
    ]
  },  

  church: {
    title: "What letter does your name start with?",
    options: [
      { text: "S", next: "sandyQuestion"},
      { text: "Y", next: "yunnieQuestion"}
    ]
  },

 yunnieQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What was the name of my longtime crush at church?", tier: "yunnie"}
    ]
  },

  duringCollege: {
    title: "How did we meet?",
    options: [
      { text: "Through class", next: "throughClass" },
      { text: "We're roommates", next: "roomMates" },
      { text: "We're dating", next: "marcoQuestion"}
    ]
  },

  marcoQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What is my favorite Pokemon?", tier: "marco"}
    ]
  },

  throughClass: {
    title: "What year did we first have class together?",
    options: [
      { text: "Freshman year", next: "freshmanYear" },
      { text: "Sophomore year", next: "sophomoreYear" },
      { text: "Junior year", next: "juniorYear" }
    ]
  },

  freshmanYear: {
    title: "Was it...",
    options: [
      { text: "Stacy's class?", next: "yinanQuestion" },
      { text: "Sustainable Systems?", next: "nishaQuestion" }
    ]
  },

  yinanQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What color are my bedsheets?", tier: "yinan"}
    ]
  },

  nishaQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "Finish the sentence: Drink like a _____", tier: "nisha"}
    ]
  },

    sophomoreYear: {
    title: "Was it...",
    options: [
      { text: "Interaction?", next: "interactionQuestion" }
    ]
  },

  interactionQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What office did we have our final critique in for Interaction 2 Studio (our professor worked there)", tier: "interactionclass"}
    ]
  },
  
  juniorYear: {
    title: "Was it...",
    options: [
      { text: "Sender-to-Receiver?", next: "senderReceiver" }
    ]
  },

  senderReceiver: {
    title: "Who are you?",
    options: [
      { text: "Matthew and Hyung", next: "matthewhyungQuestion" },
      { text: "Classmate", next: "senderreceiverQuestion"}
    ]
  },

  matthewhyungQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What movie did you assign different segments of the class to as an assignment?", tier: "matthewhyung"}
    ]
  },

 senderreceiverQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What shape are Katelyn's earrings?", tier: "senderreceiverclass"}
    ]
  },

  roomMates: {
    title: "What are your initials?",
    options: [
      { text: "CK", next: "carrieQuestion" },
      { text: "YNK", next: "yinanQuestion" },
      { text: "BK", next: "bellaQuestion" }
    ]
  },

  bellaQuestion: {
    title: "Enter password to access message",
    options: [
      { text: "What gym did we both go to for a short time (was too expensive)", tier: "bella"}
    ]
  }, 

  neverMet: {
    title: "Hello! Since we don't know each other, here's some basic facts about me.",
    options: [
      { text: "Sure", tier: "about" }
    ]
  }
};

function renderQuestion(stepKey) {
  const step = questions[stepKey];
  document.getElementById('question-title').textContent = step.title;
  const optionsContainer = document.getElementById('question-options');
  optionsContainer.innerHTML = '';

  step.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.textContent = opt.text;
    btn.classList.add('popup-option');

    if (opt.next) {
      btn.addEventListener('click', () => renderQuestion(opt.next));
    } else if (opt.tier) {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#message-buttons .locked-msg').forEach(msg => {
          msg.classList.toggle('highlight', msg.dataset.tier === opt.tier);
        });
      
        setTimeout(() => {
          const firstHighlighted = document.querySelector('.locked-msg.highlight');
          if (firstHighlighted) {
            firstHighlighted.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 50);
      
        document.getElementById('question-popup').classList.add('hidden');
      });      
    }

    optionsContainer.appendChild(btn);
  });
}

document.getElementById('question-trigger').addEventListener('click', () => {
  renderQuestion('step1');
  document.getElementById('question-popup').classList.remove('hidden');
});


container.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX - offsetX;
  startY = e.clientY - offsetY;
});

document.addEventListener('mouseup', () => isDragging = false);

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  offsetX = e.clientX - startX;
  offsetY = e.clientY - startY;
  field.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
});

document.getElementById("submit-cookie").addEventListener("click", async () => {
  const message = document.getElementById("user-message").value.trim();
  const password = prompt("Set a password for this message:");

  if (!message) {
    alert("Message is required.");
    return;
  }  

  const { error } = await supabase.from('cookies').insert([{ message, password: password || null }]);
  if (error) {
    console.error("Error saving message:", error);
    alert("Failed to store your message.");
  } else {
    alert("Your locked message is stored!");
    document.getElementById("user-message").value = "";
    loadMessageButtons();
  }
});

document.getElementById('toggle-form').addEventListener('click', () => {
  const form = document.getElementById('cookie-form');
  form.style.display = form.style.display === 'block' ? 'none' : 'block';
});