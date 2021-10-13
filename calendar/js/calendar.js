/*jshint esversion: 6*/

// 카렌다 생성자 함수
function Calendar(elem) {
  this.elem = elem;
  this.hash = window.location.hash;
  this.year = new Date().getFullYear();
  this.month = new Date().getMonth();
  this.schedules = [],
  this.firstDay = new Date(this.year,this.month,01).getDay();
  this.lastDate = 0;
  this.sorting = "month";
  // 카렌다 시작
  this.start = () => {
    httpGet("/study/calendar/month.html", responseText => {
      const areaCalendar = document.getElementById("areaCalendar");
      areaCalendar.innerHTML = responseText;
      this.goToHash();
      this.setHash();
      this.drawYearMonth();
      this.drawDays();
      this.getSchedule();
      this.markToday();
      this.arrowControl();
    });
  };
  this.start();
}
Calendar.prototype.goToHash = function(){
  const url = window.location;
  if(url.hash){
    this.year = Number(this.hash.split("-")[0].split("#")[1]);
    this.month = Number(this.hash.split("-")[1]-1);
  }
};
Calendar.prototype.setHash = function(){
  // hash 붙이기
  const url = window.location;
  url.href = `${url.origin}${url.pathname}#${this.year}-${this.month+1}`;
};
// 각 달은 몇 일 까지 인지 정하기
Calendar.prototype.setEnstartDayTd = function(){
  const
    year = this.year,
    month = this.month + 1,
    monthsLongDays = [1,3,5,7,8,10,12],
    monthsShortDays = [4,6,9,11],
    february = 2
  ;
  if(monthsLongDays.includes(month)){
    this.lastDate = 31;
  }else if(monthsShortDays.includes(month)){
    this.lastDate = 30;
  }else if(february === month){
    if(year % 4 === 0){
      this.lastDate = 29;
    }else{
      this.lastDate = 28;
    }
  }
};
// 해당 연도, 달 텍스트 넣기
Calendar.prototype.drawYearMonth = function(){
  // 해당 연도, 달 텍스트 넣기
  const
    $year = this.elem.querySelectorAll("[data-js='nowYear']"),
    $Month = this.elem.querySelectorAll("[data-js='nowMonth']")
  ;
  $year.forEach(year => {
    year.innerHTML = String(this.year);
  });
  $Month.forEach(Month => {
    Month.innerHTML = String(this.month+1);
  });
};
// 달력 날짜 그리기
Calendar.prototype.drawDays = function(){
  this.setEnstartDayTd();
  const 
    $tbody = this.elem.querySelector("tbody"),
    trNum = 6 //테이블 기본 노출 행
  ;
  // reset
  $tbody.innerHTML = "";
  this.firstDay = new Date(this.year,this.month,01).getDay();
  // draw start
  for(let i = trNum; i--;){
    $tbody.innerHTML += "<tr></tr>"
  }
  for(let i = trNum; i--;){
    const $tbodyTr = $tbody.querySelectorAll("tr")[i];
    for(let n = 7; n--;){
      $tbodyTr.innerHTML += `<td></td>`;
    }
  }
  const $tbodyTd = $tbody.querySelectorAll("td");
  for(let i = 0; i < this.lastDate; i++){
    $tbodyTd[this.firstDay + i].innerHTML = `<button class="add-schedule"><span class='date'>${i + 1}</span><span class="add-txt">+ schedule</span></button>`;
    $tbodyTd[this.firstDay + i].dataset.date = (i + 1)
  }  
};
// 오늘 표시하기
Calendar.prototype.markToday = function(){
  const today = new Date();
  if(this.month === today.getMonth() && this.year === today.getFullYear()){
    addClass(
      this.elem.querySelector(`td[data-date="${today.getDate()}"`),
      "today"
    );
  }
};
// 스케쥴 가져오기
Calendar.prototype.getSchedule = function(){
  httpGet("/study/calendar/js/schedules.js", responseText => {
    this.schedules = JSON.parse(responseText);
    for(let key in this.schedules){
      const schedule = this.schedules[key];
      if(this.year === schedule.year && this.month + 1 === schedule.month){
        const 
          year = schedule.year,
          date = schedule.date,
          month = schedule.month,
          dateLength = date.length,
          startDate = dateLength ? date[0] : date,
          startDayTd = document.querySelector(`[data-date="${startDate}"]`)
        ;

        // 요일 계샨 (장기 스케쥴일 수도 있으니 여러개인 경우 감안하여 계산.)
        const dateArr = dateLength ? date : [date];
        schedule.days = []
        for(let i = 0; i < dateArr.length; i++){
          let day = new Date(year, month-1, dateArr[i]).getDay();
          switch(day){
            case 0: schedule.days.push("일요일"); break;
            case 1: schedule.days.push("월요일"); break;
            case 2: schedule.days.push("화요일"); break;
            case 3: schedule.days.push("수요일"); break;
            case 4: schedule.days.push("목요일"); break;
            case 5: schedule.days.push("금요일"); break;
            case 6: schedule.days.push("토요일");
          }
        }
        // 일정 있는 날짜에 버튼과 팝업 삽입
        const daysNum = dateLength ? date[1] - date[0] + 2 : 1;
        const barWidth = `(2px * ${daysNum-1}) + (100% * ${daysNum})`;
        startDayTd.innerHTML += `<button id="${key}" class="detail-plan" style="width: calc(${barWidth})" draggable="true" data-js="dragDrop openPopup">${schedule.title}</button>`;
        startDayTd.innerHTML += this.popupMarkup(schedule);

        const $buttons = this.elem.querySelectorAll(`[data-js*="openPopup"]`);
        for(const button of $buttons) {
          const popup = button.parentElement.querySelector(`[data-js*="layerPopup"]`);
          this.popupInteract([button], popup)
        }
      }
    }
    this.addSchedule();
    this.dragDrop();
  });
};

// 팝업 마크업 삽입
Calendar.prototype.popupMarkup = function(schedule){
  // const thisSchedule = {month, dates, days, title, desc};
  // console.log(dates)
  // for(const key in thisSchedule){
  //   const s = thisSchedule;
  //   if(!s[key]){
  //     s[key] = `<input type='text' placeholder='${key}'> </input>`
  //   }
  // }
  return `
    <div class="layerPopup hide" data-js="layerPopup">
      <p class="date">
        ${schedule.month}/${schedule.date}</span>  ${schedule.days}
      </p>
      <h3 class="tit-sch">${schedule.title}</h3>
      <p class="desc" data-js="schDesc">${schedule.description}</p>
      <button class="close" data-js="close"> <i class="icon-cross"></i> <span class="ir-hidden">닫기</span></button>
    </div>
  `;
};
// 팝업 상호작용
Calendar.prototype.popupInteract = function(buttons, popup){
  console.log(buttons,popup)
  clickEvent(buttons, e => {
    const activePopup = document.querySelector('.layerPopup.show')
    activePopup && hide(activePopup)
    show(popup);
    const winW = window.innerWidth,
          popupW = popup.clientWidth;
    if(e.clientX > winW - popupW - 30){
      popup.classList.add("rtl")
    }
  });

  const close = popup.querySelectorAll("[data-js='close']");
  clickEvent(close, e => {
    hide(popup);
  });
}
// 스케쥴 드래그앤드랍
Calendar.prototype.dragDrop = function(){
  const targets = this.elem.querySelectorAll("[data-js*='dragDrop']"),
        tds = this.elem.querySelectorAll("td");

  targets.forEach(target => {
    target.ondragstart = function(e){
      e.dataTransfer.setData("plan", e.target.id);
    };
  });

  tds.forEach(td =>{
    td.ondrop = function(e){
      e.preventDefault();
      const data = e.dataTransfer.getData("plan");
      td.appendChild(document.getElementById(data));
    };
    td.ondragover = function(e){
      e.preventDefault();
    };
  });
};
// 스케쥴 삽입
Calendar.prototype.addSchedule = function(){
  const btnAddSchedule = document.querySelectorAll(".add-schedule")
  for(const btn of btnAddSchedule){
    btn.onclick = e => {
      console.log(btn.parentElement)
      console.log(this.month, btn.parentElement.dataset.date)
      const month = this.month
      btn.parentElement.innerHTML += this.popupMarkup({month, dateArr, days, title, desc});
      $popup = btn.parentElement.querySelector(`[data-js*="layerPopup"]`);
      show($popup);
    }
  }
};

// 이전, 다음 버튼 클릭 이벤트
Calendar.prototype.arrowControl = function(){
  const $arrows = this.elem.querySelectorAll(".area-arrow button");
  clickEvent($arrows, e => {
    const chkPrev = hasClass(e.target, "prev"),
          _month = this.month,
          _year = this.year,
          calc = chkPrev ? -1 : 1,
          firstM = 0,
          lastM = 11;
    let nextM;
    if(this.sorting === "month"){
      if(_month !== lastM && _month !== firstM){
        this.month = _month + calc;
      }else if(_month === lastM){
        nextM = chkPrev ? _month + calc : firstM;
        this.month = nextM;
        this.year = chkPrev ? _year : _year + calc;
      }else if(_month === firstM){
        nextM = chkPrev ? lastM : _month + calc;
        this.month = nextM;
        this.year = chkPrev ? _year + calc : _year;
      }
    }else if(this.sorting === "year"){
      this.year = _year + calc;
    }
    this.setHash();
    this.drawYearMonth();
    this.drawDays();
    this.getSchedule();
    this.markToday();
  });
};

const calendar = new Calendar(document.getElementById("wrapCalendar"));
// console.log(calendar)