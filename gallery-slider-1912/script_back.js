/*jshint esversion: 6*/



const btnLayerToggles = document.querySelectorAll("[data-role*='layertoggle']"),
      targetLayers = document.querySelectorAll("[data-role*='layertarget']");

  btnLayerToggles.forEach(btnLayerToggle => {
    btnLayerToggle.addEventListener("click", (e)=>{      
      let i = btnLayerToggle.dataset.index;
      const targetLayer = document.querySelectorAll("[data-role*='layertarget'][data-index*='"+i+"']"),
            thisLayer = new Fn(targetLayer);
      if(thisLayer.hasClass("open")){
        thisLayer.removeClass("open");
      }else{
        thisLayer.addClass("open");
      }
    });
  });


/*
 생성자 함수
  - 객체를 생성하는 함수
  - 대문자로 시작한다.
*/
// START: 공통 사용 생성자 함수
function Fn(_el) {
  this.el = _el;
}

// class 추가 메서드
Fn.prototype.addClass = function(str) {
  if(this.el.length > 1){
    this.el.forEach( el => {
      el.className += " " +str;
    });
  }else{
    this.el.className += " " +str;
  }  
};

// class 삭제 메서드
Fn.prototype.removeClass = function(str) {
  if(this.el.length > 1){
    this.el.forEach(el => {
      el.className = el.className.replace(" "+str,"");
    });
  }else{
    this.el.className = this.el.className.replace(" "+str,"");
  }
};

// class 가지고 있는지 체크 메서드
Fn.prototype.hasClass = function(str) {
  let arr = this.el.className.split(" ");
  if(arr.indexOf(str) > -1){
    return true;
  }else{
    return false;
  }
};

// 특정 attr 교체 메서드
Fn.prototype.attr = function(attribute, str) {
  if(str){//str값이 있으면 엘리먼트의 속성값을 str값으로 변경
    this.el.attributes[attribute] = str;
  }else{//str값이 없으면 엘리먼트의 속성값을 리턴
    return this.el.attributes[attribute];
  }
};

// 특정 attr 가진 엘리먼트 return 메서드
Fn.prototype.whichAttr = function(attribute, str) {
  let that;
  this.el.forEach(el => {
    let arr = el.attributes[attribute].value.split(" ");
    if(arr.indexOf(str) > -1){
      that = el;
    }else{      
      return false;
    }
  });
  return that;
};
// END : 공통 사용 생성자 함수



function elDataset(els, dataSetName, dataSetValue){
  let target;
  els.forEach(el => {
    if(el.dataset[dataSetName] === dataSetValue){
      target = el;
    }
  });
  return target;
}
