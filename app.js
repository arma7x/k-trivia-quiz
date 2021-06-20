const xhr = function(method, url, data={}, query={}, headers={}) {
  return new Promise((resolve, reject) => {
    var xhttp = new XMLHttpRequest();
    var _url = new URL(url);
    for (var y in query) {
      _url.searchParams.set(y, query[y]);
    }
    url = _url.origin + _url.pathname + '?' + _url.searchParams.toString();
    xhttp.onreadystatechange = function() {
      if (this.readyState == 4) {
        if (this.status >= 200 && this.status <= 299) {
          try {
            const response = JSON.parse(xhttp.response);
            resolve({ raw: xhttp, response: response});
          } catch (e) {
            resolve({ raw: xhttp, response: xhttp.responseText});
          }
        } else {
          try {
            const response = JSON.parse(xhttp.response);
            reject({ raw: xhttp, response: response});
          } catch (e) {
            reject({ raw: xhttp, response: xhttp.responseText});
          }
        }
      }
    };
    xhttp.open(method, url, true);
    for (var x in headers) {
      xhttp.setRequestHeader(x, headers[x]);
    }
    if (Object.keys(data).length > 0) {
      xhttp.send(JSON.stringify(data));
    } else {
      xhttp.send();
    }
  });
}

const CATEGORY = [
  {"value": "any", "text": "Any Category"},
  {"value": "9", "text": "General Knowledge"},
  {"value": "10", "text": "Entertainment: Books"},
  {"value": "11", "text": "Entertainment: Film"},
  {"value": "12", "text": "Entertainment: Music"},
  {"value": "13", "text": "Entertainment: Musicals &amp; Theatres"},
  {"value": "14", "text": "Entertainment: Television"},
  {"value": "15", "text": "Entertainment: Video Games"},
  {"value": "16", "text": "Entertainment: Board Games"},
  {"value": "17", "text": "Science &amp; Nature"},
  {"value": "18", "text": "Science: Computers"},
  {"value": "19", "text": "Science: Mathematics"},
  {"value": "20", "text": "Mythology"},
  {"value": "21", "text": "Sports"},
  {"value": "22", "text": "Geography"},
  {"value": "23", "text": "History"},
  {"value": "24", "text": "Politics"},
  {"value": "25", "text": "Art"},
  {"value": "26", "text": "Celebrities"},
  {"value": "27", "text": "Animals"},
  {"value": "28", "text": "Vehicles"},
  {"value": "29", "text": "Entertainment: Comics"},
  {"value": "30", "text": "Science: Gadgets"},
  {"value": "31", "text": "Entertainment: Japanese Anime &amp; Manga"},
  {"value": "32", "text": "Entertainment: Cartoon &amp; Animations"},
]

const DIFFICULTY = [
  {"value": "any", "text": "Any Difficulty"},
  {"value": "easy", "text": "Easy"},
  {"value": "medium", "text": "Medium"},
  {"value": "hard", "text": "Hard"},
]

const TYPE = [
  {"value": "any", "text": "Any Type"},
  {"value": "multiple", "text": "Multiple Choice"},
  {"value": "boolean", "text": "True/False"},
]

function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

window.addEventListener("load", function() {

  const state = new KaiState({});

  const startQuiz = function($router, questions) {

    questions.forEach((_, i) => {
      for (var x in questions[i]) {
        if (typeof questions[i][x] === 'string') {
          questions[i][x] = atob(questions[i][x]);
        } else if (typeof questions[i][x] === 'object' && questions[i][x].length !== undefined) {
          for (var y in questions[i][x]) {
            questions[i][x][y] = atob(questions[i][x][y]);
          }
        }
      }
      questions[i]['your_answer'] = '';
      questions[i]['correct'] = false;
    });

    const LEN = questions.length;

    $router.push(
      new Kai({
        name: 'quizPaper',
        data: {
          score: 0,
          finish: false,
          question: {},
          index: 0,
        },
        templateUrl: document.location.origin + '/templates/quizPaper.html',
        mounted: function() {
          this.methods.renderQuestion(this.data.index);
        },
        unmounted: function() {},
        methods: {
          renderQuestion: function(idx) {
            this.setData({
              question: questions[idx]
            });
            this.$router.setHeaderTitle(`Question ${idx+1}/${LEN}`);
            if (!this.data.finish) {
              this.$router.setSoftKeyText('Answers', '', 'Submit');
            } else {
              this.$router.setSoftKeyText('', 'Score', '');
            } 
          },
          showScore: function() {
            displayKaiAds();
            this.$router.showDialog('Score', `Your score is ${this.data.score}/${LEN}`, null, ' ', () => {}, ' ', () => {}, ' ', null, () => {
                this.methods.renderQuestion(this.data.index);
            });
          }
        },
        softKeyText: { left: '', center: '', right: '' },
        softKeyListener: {
          left: function() {
            if (this.data.finish)
              return
            const answers = [{ "text": this.data.question.correct_answer }];
            this.data.question.incorrect_answers.forEach((a) => {
              answers.push({ "text": a });
            });
            shuffleArray(answers);
            const idx = answers.findIndex((opt) => {
              return opt.text === this.data.question.your_answer;
            });
            this.$router.showSingleSelector('Select', answers, 'Select', (selected) => {
              questions[this.data.index]['your_answer'] = selected.text;
              this.setData({
                question: questions[this.data.index]
              });
            }, 'Cancel', null, () => {
              this.methods.renderQuestion(this.data.index);
            }, (idx > -1 ? idx : 0));
          },
          center: function() {
            if (!this.data.finish)
              return
            this.methods.showScore();
          },
          right: function() {
            if (this.data.finish)
              return
            const a = questions[this.data.index]['your_answer'];
            if (a == '') {
              this.$router.showToast("Please pick the answer");
              return
            }
            this.$router.showDialog('Confirm', `Are you sure to submit ${questions[this.data.index]['your_answer']} ?`, null, 'Yes', () => {
              if (questions[this.data.index + 1]) {
                this.data.index += 1;
                this.$router.showToast(`Question ${this.data.index+1}`);
              } else {
                var score = 0;
                questions.forEach((_, i) => {
                  console.log(questions[i]['your_answer'] === questions[i]['correct_answer']);
                  if (questions[i]['your_answer'] === questions[i]['correct_answer']) {
                    questions[i]['correct'] = true;
                    score += 1;
                  } else {
                    questions[i]['correct'] = false;
                  }
                });
                this.setData({ finish: true, score: score });
                this.$router.showToast("Finished");
                setTimeout(this.methods.showScore, 100);
              }
              this.methods.renderQuestion(this.data.index);
            }, 'No', () => {}, ' ', null, () => {
              this.methods.renderQuestion(this.data.index);
            });
          }
        },
        dPadNavListener: {
          arrowLeft: function() {
            if (!this.data.finish)
              return
            if (questions[this.data.index - 1]) {
              this.data.index -= 1;
              this.methods.renderQuestion(this.data.index);
            }
          },
          arrowRight: function() {
            if (!this.data.finish)
              return
            if (questions[this.data.index + 1]) {
              this.data.index += 1;
              this.methods.renderQuestion(this.data.index);
            }
          }
        },
        backKeyListener: function() {
          this.$router.showDialog('Quit', 'Are you sure to quit ?', null, 'Yes', () => {
              $router.pop();
            }, 'No', () => {}, ' ', null, () => {
              this.methods.renderQuestion(this.data.index);
          });
          return true;
        }
      })
    );
  }

  const helpSupportPage = new Kai({
    name: 'helpSupportPage',
    data: {
      title: 'helpSupportPage'
    },
    templateUrl: document.location.origin + '/templates/helpnsupport.html',
    mounted: function() {
      this.$router.setHeaderTitle('Help & Support');
      navigator.spatialNavigationEnabled = false;
    },
    unmounted: function() {},
    methods: {},
    softKeyText: { left: '', center: '', right: '' },
    softKeyListener: {
      left: function() {},
      center: function() {},
      right: function() {}
    }
  });

  const home = new Kai({
    name: 'home',
    data: {
      token: false,
      amount: '',
      category: {},
      difficulty: {},
      type: {},
      categories: CATEGORY,
      difficulties: DIFFICULTY,
      types: TYPE
    },
    verticalNavClass: '.homeNav',
    components: [],
    templateUrl: document.location.origin + '/templates/home.html',
    mounted: function() {
      this.$router.setHeaderTitle('Quiz Wizard');
      this.setData({
        category: CATEGORY[0],
        difficulty: DIFFICULTY[0],
        type: TYPE[0],
      });
      if (!this.data.token) {
        this.methods.getToken();
      }
    },
    unmounted: function() {
      
    },
    methods: {
      getToken: function() {
        this.$router.showToast("Generating token");
        this.$router.showLoading();
        xhr('GET', `https://opentdb.com/api_token.php?command=request`)
        .then((data) => {
          if (data.response.token) {
            this.setData({ token: data.response.token });
            console.log(this.data.token);
          }
        })
        .catch((err) => {
          console.log(err);
        })
        .finally(() => {
          this.$router.showToast("Done");
          this.$router.hideLoading();
        });
      },
      selectCategory: function() {
        const idx = this.data.categories.findIndex((opt) => {
          return opt.text === this.data.category.text;
        });
        this.$router.showSingleSelector('Select', this.data.categories, 'Select', (selected) => {
          this.setData({
            amount: document.getElementById('amount').value,
            category: selected
          });
        }, 'Cancel', null, undefined, (idx > -1 ? idx : 0));
      },
      selectDifficulty: function() {
        const idx = this.data.difficulties.findIndex((opt) => {
          return opt.text === this.data.difficulty.text;
        });
        this.$router.showSingleSelector('Select', this.data.difficulties, 'Select', (selected) => {
          this.setData({
            amount: document.getElementById('amount').value,
            difficulty: selected
          });
        }, 'Cancel', null, undefined, (idx > -1 ? idx : 0));
      },
      selectType: function() {
        const idx = this.data.types.findIndex((opt) => {
          return opt.text === this.data.type.text;
        });
        this.$router.showSingleSelector('Select', this.data.types, 'Select', (selected) => {
          this.setData({
            amount: document.getElementById('amount').value,
            type: selected
          });
        }, 'Cancel', null, undefined, (idx > -1 ? idx : 0));
      },
      submit: function() {
        try {
          const amount = JSON.parse(document.getElementById('amount').value);
          if (amount > 50) {
            this.$router.showToast("Max num of question is 50");
            return
          }
          var q = `amount=${amount}`;
          q += `&token=${this.data.token}`
          if (this.data.category.value !== 'any') {
            q += `&category=${this.data.category.value}`
          }
          if (this.data.difficulty.value !== 'any') {
            q += `&difficulty=${this.data.difficulty.value}`
          }
          if (this.data.type.value !== 'any') {
            q += `&type=${this.data.type.value}`
          }
          q += `&encode=base64`;
          this.$router.showLoading();
          xhr('GET', `https://opentdb.com/api.php?${q}`)
          .then((data) => {
            //Code 0: Success Returned results successfully.
            //Code 1: No Results Could not return results. The API doesn't have enough questions for your query. (Ex. Asking for 50 Questions in a Category that only has 20.)
            //Code 2: Invalid Parameter Contains an invalid parameter. Arguements passed in aren't valid. (Ex. Amount = Five)
            //Code 3: Token Not Found Session Token does not exist.
            //Code 4: Token Empty Session Token has returned all possible questions for the specified query. Resetting the Token is necessary.
            switch (data.response.response_code) {
              case 0:
                startQuiz(this.$router, data.response.results);
                break;
              case 1:
                this.$router.showToast("The API doesn't have enough questions");
                break;
              case 2:
                this.$router.showToast("Invalid Parameter");
                break;
              case 3:
                this.$router.showToast("Token Not Found, please Exit app");
                break;
              case 4:
                // this.$router.showToast("Token Not Found");
                break;
              }
          })
          .catch((err) => {
            console.log(err);
          })
          .finally(() => {
            this.$router.hideLoading();
          });
        } catch(e) {
          console.log(document.getElementById('amount').value);
          this.$router.showToast("Please enter num of question");
        }
        
      }
    },
    softKeyText: { left: 'Help', center: 'SELECT', right: 'Exit' },
    softKeyListener: {
      left: function() {
        this.$router.push('helpSupportPage');
      },
      center: function() {
        const listNav = document.querySelectorAll(this.verticalNavClass);
        if (this.verticalNavIndex > -1) {
          listNav[this.verticalNavIndex].click();
        }
      },
      right: function() {
        this.$router.showDialog('Exit', 'Are you sure to exit ?', null, 'Yes', () => {
          window.close();
        }, 'No', () => {}, ' ', null, () => {});
      }
    },
    dPadNavListener: {
      arrowUp: function() {
        this.navigateListNav(-1);
      },
      arrowRight: function() {
        // this.navigateTabNav(-1);
      },
      arrowDown: function() {
        this.navigateListNav(1);
      },
      arrowLeft: function() {
        // this.navigateTabNav(1);
      },
    }
  });

  const router = new KaiRouter({
    title: 'KaiKit',
    routes: {
      'index' : {
        name: 'home',
        component: home
      },
      'helpSupportPage': {
        name: 'helpSupportPage',
        component: helpSupportPage
      },
    }
  });

  const app = new Kai({
    name: '_APP_',
    data: {},
    templateUrl: document.location.origin + '/templates/template.html',
    mounted: function() {},
    unmounted: function() {},
    router,
    state
  });

  try {
    app.mount('app');
  } catch(e) {
    console.log(e);
  }

  function displayKaiAds() {
    var display = true;
    if (window['kaiadstimer'] == null) {
      window['kaiadstimer'] = new Date();
    } else {
      var now = new Date();
      if ((now - window['kaiadstimer']) < 300000) {
        display = false;
      } else {
        window['kaiadstimer'] = now;
      }
    }
    console.log('Display Ads:', display);
    if (!display)
      return;
    getKaiAd({
      publisher: 'ac3140f7-08d6-46d9-aa6f-d861720fba66',
      app: 'trivia-quiz',
      slot: 'kaios',
      onerror: err => console.error(err),
      onready: ad => {
        ad.call('display')
        setTimeout(() => {
          document.body.style.position = '';
        }, 1000);
      }
    })
  }

  displayKaiAds();

  document.addEventListener('visibilitychange', function(ev) {
    if (document.visibilityState === 'visible') {
      displayKaiAds();
    }
  });
});
