/*jshint esversion: 6*/

// 카렌다 생성자 함수
function Calendar(elem) {
  this.elem = elem
  this.hash = window.location.hash
  this.year = new Date().getFullYear()
  this.month = new Date().getMonth()
  this.schedules = []
  this.firstDay = new Date(this.year,this.month,01).getDay()
  this.lastDate = 0
  this.sorting = "month"
  // 카렌다 시작
  this.start = () => {
    httpGet("/calendar/month.html", responseText => {
      const areaCalendar = document.getElementById("areaCalendar")
      areaCalendar.innerHTML = responseText
      this.goToHash()
      this.setHash()
      this.drawYearMonth()
      this.drawDays()
      this.getSchedule()
      this.addNewSchedule()
      this.markToday()
      this.arrowControl()
    })
  }
  this.start()
}
Calendar.prototype.goToHash = function(){
  const url = window.location
  if(url.hash){
    this.year = Number(this.hash.split("-")[0].split("#")[1])
    this.month = Number(this.hash.split("-")[1]-1)
  }
}
Calendar.prototype.setHash = function(){
  // hash 붙이기
  const url = window.location
  url.href = `${url.origin}${url.pathname}#${this.year}-${this.month+1}`
}
// 각 달은 몇 일 까지 인지 정하기
Calendar.prototype.setEnstartDayTd = function(){
  const year = this.year
  const month = this.month + 1
  const monthsLongDays = [1,3,5,7,8,10,12]
  const monthsShortDays = [4,6,9,11]
  const february = 2
  
  if(monthsLongDays.includes(month)){
    this.lastDate = 31
  }else if(monthsShortDays.includes(month)){
    this.lastDate = 30
  }else if(february === month){
    if(year % 4 === 0){
      this.lastDate = 29
    }else{
      this.lastDate = 28
    }
  }
}
// 해당 연도, 달 텍스트 넣기
Calendar.prototype.drawYearMonth = function(){
  // 해당 연도, 달 텍스트 넣기
  const $year = this.elem.querySelectorAll("[data-js='nowYear']")
  const $Month = this.elem.querySelectorAll("[data-js='nowMonth']")
  
  $year.forEach(year => {
    year.innerHTML = String(this.year)
  })
  $Month.forEach(Month => {
    Month.innerHTML = String(this.month+1)
  })
}
// 달력 날짜 그리기
Calendar.prototype.drawDays = function(){
  this.setEnstartDayTd()
  const $tbody = this.elem.querySelector("tbody")
  const trNum = 6 //테이블 기본 노출 행
  
  // reset
  $tbody.innerHTML = ""
  this.firstDay = new Date(this.year,this.month,01).getDay()
  // draw start
  for(let i = trNum; i--;){
    $tbody.innerHTML += "<tr></tr>"
  }
  for(let i = trNum; i--;){
    const $tbodyTr = $tbody.querySelectorAll("tr")[i];
    for(let n = 7; n--;){
      $tbodyTr.innerHTML += `<td></td>`
    }
  }
  const $tbodyTd = $tbody.querySelectorAll("td")
  for(let i = 0; i < this.lastDate; i++){
    $tbodyTd[this.firstDay + i].innerHTML = `<button class="add-schedule"><span class='date'>${i + 1}</span><span class="add-txt">+ schedule</span></button>`
    $tbodyTd[this.firstDay + i].dataset.date = (i + 1)
  }  
}
// 오늘 표시하기
Calendar.prototype.markToday = function(){
  const today = new Date()
  if(this.month === today.getMonth() && this.year === today.getFullYear()){
    addClass(
      this.elem.querySelector(`td[data-date="${today.getDate()}"`),
      "today"
    )
  }
}
// 스케쥴 가져오기
Calendar.prototype.getSchedule = function(){
  httpGet("/calendar/js/schedules.js", responseText => {
    this.schedules = JSON.parse(responseText)
    this.drawSchedulesHandler()
    this.dragDrop()
  })
}

Calendar.prototype.setScheduleState = function(sce){
  
}

Calendar.prototype.drawSchedulesHandler = function() {
  for(let index in this.schedules){
    const schedule = this.schedules[index]
    schedule.index = Number(index)
    if(this.year === schedule.year && this.month + 1 === schedule.month){
      // 요일 계샨 (장기 스케쥴일 수도 있으니 여러개인 경우 감안하여 계산.)
      schedule.days = this.getWhatDay(schedule.year, schedule.month, schedule.date)
      // 일정 있는 날짜에 버튼과 팝업 삽입
      this.drawSchedule(schedule)
      // 삽입된 버튼에 이벤트 추가
      this.addPopupEvent(schedule)
    }
  }
}

Calendar.prototype.drawSchedule = function(schedule){
  const date = schedule.date
  const daysNum = Array.isArray(date) ? date[1] - date[0] + 2 : 1
  const barWidth = `(2px * ${daysNum-1}) + (100% * ${daysNum})`
  const viewButton = this.viewButtonHTML(barWidth, schedule)
  const schedulePopup = this.schedulePopupHTML(schedule)
  if(!schedule.area) {
    schedule.area = document.querySelector(`[data-date="${date}"]`)
  }
  schedule.area.appendChild(viewButton)
  schedule.area.appendChild(schedulePopup)
  schedule.viewButton = viewButton
  schedule.popup = schedulePopup
  schedule.isPopupOn = false
}

Calendar.prototype.viewButtonHTML = function(barWidth, schedule){
  const button = document.createElement('button')
  button.classList.add('view-schedule')
  button.style = `width: calc(${barWidth})`
  button.setAttribute('draggable', true)
  button.dataset.js = 'dragDrop'
  button.dataset.index = schedule.index
  button.innerHTML = schedule.title
  return button
}

Calendar.prototype.getWhatDay = function(year, month, date){  
  const dateArr = Array.isArray(date) ? date : [date]
  const days = []
  for(let i = 0; i < dateArr.length; i++){
    let day = new Date(year, month-1, dateArr[i]).getDay();
    switch(day){
      case 0: days.push("일요일"); break
      case 1: days.push("월요일"); break
      case 2: days.push("화요일"); break
      case 3: days.push("수요일"); break
      case 4: days.push("목요일"); break
      case 5: days.push("금요일"); break
      case 6: days.push("토요일");
    }
  }
  return days
}

// 스케줄 자세히 보기 팝업 마크업 삽입
Calendar.prototype.periodText = function(month, date, days) {
  return `${month}월 ${date}일 (${days})`
}
Calendar.prototype.schedulePopupHTML = function(schedule){
  const popup = document.createElement('div')
  popup.classList.add('layerPopup','hide')
  popup.dataset.js = 'layerPopup'
  popup.dataset.index = schedule.index

  const month = schedule.month
  const date = schedule.date
  const days = schedule.days
  const title = schedule.title
  const description = schedule.description
  let periodText = this.periodText(month, date, days)
  if(Array.isArray(date)) {
    periodText = `${this.periodText(month, date[0], days[0])} ~ ${this.periodText(month, date[1], days[1])}`
  }

  popup.innerHTML = `
  <div class="area-basic">
    <div class="content">
      <h3 class="tit-sch"><button class="change-title">${title}</button></h3>
      <input type="text" value="${title}" class="tit-sch"/>
      <p class="period"><button class="change-period">${periodText}</button></p>
      <p class="desc" data-js="schDesc"><button class="change-desc">${description}</button></p>
      <input type="text" value="${description}" class="desc"/>
    </div>
    <div class="bottom"><button class="save-schedule">저장</button></div>
  </div>
  <button class="close" data-js="close"> <i class="icon-cross"></i> <span class="ir-hidden">닫기</span></button>
  `
  return popup
}
// 팝업 상호작용
Calendar.prototype.addPopupEvent = function(schedule){
  schedule.viewButton.addEventListener('click', e => this.showPopup(e.clientX, schedule))
  this.addCloseEvent(schedule)
}

Calendar.prototype.popupPosition = function(clientX, popup){
  const winW = window.innerWidth
  const popupW = popup.clientWidth
  if(clientX > winW - popupW - 30){
    popup.classList.add("rtl")
  }
}

Calendar.prototype.showPopup = function(clientX, schedule){
  const activePopup = document.querySelector('.layerPopup.show')
  if(activePopup) {
    const activeSchedule = this.schedules[activePopup.dataset.index]
    this.closePopup(activeSchedule)
  }
  this.popupPosition(clientX, schedule.popup)
  show(schedule.popup)
}

Calendar.prototype.closePopup = function(schedule){
  if(schedule.title === 'new schedule') {
    schedule.viewButton.remove()
    schedule.viewButton = null
  }
  hide(schedule.popup)
}

Calendar.prototype.addCloseEvent = function(schedule){
  const closeButton = schedule.popup.querySelector("button[data-js='close']")
  closeButton.addEventListener('click', () => this.closePopup(schedule))
}

// 스케쥴 드래그앤드랍
Calendar.prototype.dragDrop = function(){
  const targets = this.elem.querySelectorAll("[data-js*='dragDrop']"),
        tds = this.elem.querySelectorAll("td")

  targets.forEach(target => {
    target.ondragstart = function(e){
      e.dataTransfer.setData("plan", e.target.id)
    }
  })

  tds.forEach(td =>{
    td.ondrop = function(e){
      e.preventDefault()
      const data = e.dataTransfer.getData("plan")
      td.appendChild(document.getElementById(data))
    }
    td.ondragover = function(e){
      e.preventDefault()
    }
  })
}
// 스케쥴 삽입
Calendar.prototype.addNewSchedule = function(){
  const btnAddNewSchedule = document.querySelectorAll(".add-schedule")
  for(const btn of btnAddNewSchedule){
    btn.onclick = e => {
      // 스코프 내 공통 변수
      const buttonTd = btn.parentElement
      // 일정 있는 날짜에 버튼과 팝업 삽입
      const date = Number(buttonTd.dataset.date)
      const month = this.month + 1
      const newSchedule = {
        index: this.schedules.length,
        year: this.year,
        month: month,
        date: date,
        days: this.getWhatDay(this.year, month, date),
        title: 'new schedule',
      }
      this.drawSchedule(newSchedule)
      this.addPopupEvent(newSchedule)
      this.showPopup(e.clientX, newSchedule)
      // 스케줄 데이터 저장
      this.schedules.push(newSchedule)
    }
  }
}
// 이전, 다음 버튼 클릭 이벤트
Calendar.prototype.arrowControl = function(){
  const $arrows = this.elem.querySelectorAll(".area-arrow button")
  clickEvent($arrows, e => {
    const chkPrev = hasClass(e.target, "prev"),
          _month = this.month,
          _year = this.year,
          calc = chkPrev ? -1 : 1,
          firstM = 0,
          lastM = 11
    let nextM
    if(this.sorting === "month"){
      if(_month !== lastM && _month !== firstM){
        this.month = _month + calc
      }else if(_month === lastM){
        nextM = chkPrev ? _month + calc : firstM
        this.month = nextM
        this.year = chkPrev ? _year : _year + calc
      }else if(_month === firstM){
        nextM = chkPrev ? lastM : _month + calc
        this.month = nextM
        this.year = chkPrev ? _year + calc : _year
      }
    }else if(this.sorting === "year"){
      this.year = _year + calc
    }
    this.setHash()
    this.drawYearMonth()
    this.drawDays()
    this.drawSchedulesHandler()
    this.markToday()
  })
}

const calendar = new Calendar(document.getElementById("wrapCalendar"))
// console.log(calendar) 