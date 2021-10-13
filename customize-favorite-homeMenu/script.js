/*jshint esversion: 6 */
(function(){
  const $menuArea = document.querySelector(".box_icon_link .list_icon_link"),
        $btnSetting = document.querySelector("[data-role='setting'] button"),        
        $ajaxArea = document.querySelector("[data-role='ajax-area']"),
        btnSettingHTML = $btnSetting.parentElement.outerHTML;

  const countHTML = { open: "<span class='num'>", close: "</span>" },
        listHTML = { open: "<li><a href='#'>", close: "</a></li>" },
        storageName = "storedMenu";

  // 셋팅 버튼 클릭시
  $btnSetting.addEventListener("click", () => {
      makeAjaxRequest($ajaxArea, "GET", "setting.html");
  });

  // ajax 요청 reponseText받은 후 afterAjax() 실행
  function makeAjaxRequest(where, how, what){
    //JavaScript를 이용하여 서버로 보내는 HTTP request를 만들기 위해서는 그에 맞는 기능을 제공하는 Object의 인스턴스가 필요.
    //XMLHttpRequest 가 그러한 Object의 한 예
    let httpRequest = new XMLHttpRequest();

    httpRequest.onreadystatechange = () => {
    //통신 에러 (서버가 다운되는 상황 등) 상황에서, status 필드를 접근하려 하면 onreadystatechange 메서드에서 예외에러를 발생 시킬 것입니다. 이러한 문제를 예방하기 위해서 if...then 구문을 try…catch 구문으로 감싸주세요.
      try{
        if(httpRequest.readyState === XMLHttpRequest.DONE){
          if(httpRequest.status === 200){
            where.innerHTML = httpRequest.responseText;
            afterAjax();
          }else{
            console.log("request에 뭔가 문제가 있댜.");
          }
        }
      } catch(e){
        alert("Caught Exception: " + e.description);
      }
    };
    httpRequest.open(how, what, true);
    httpRequest.send();
  }

  //ajax 요청 완료 후 실행 이벤트
  function afterAjax(){
    const $chkBoxes = document.querySelectorAll("input[type='checkbox']"),
          $closeBtn = document.querySelector(".btn_close button"),
          $setupBtn = document.querySelector("button[data-role='setting']"),
          $resetBtn = document.querySelector("button[data-role='default']"),
          $defaultSetBtn = document.querySelector("button[data-role='defaultSet']");

    let selectMenus = [],
        defaultMenus = ["내 차 정보", "상용블루핸즈", "자가진단", "정비 예약", "긴급출동"];

    //레이어 팝업 체크박스 클릭
    $chkBoxes.forEach($chkBox => {
      const $menuText = $chkBox.parentElement.querySelector("span");
      // 이전에 설정해놓은 메뉴가 있을 경우엔 그대로 체크박스 셋팅
      if(localStorage.getItem("storedMenu")){
        selectMenus = localStorage.getItem("storedMenu").split(",")
        let  i = 1;
        selectMenus.forEach(selectMenu => {
          if(selectMenu == $menuText.innerHTML){
            $chkBox.checked = true;
            $menuText.innerHTML += countHTML.open + i + countHTML.close;
          }
          i++;
        });
      }
      // 체크박스 클릭 했을 때
      $chkBox.addEventListener("click", (e) => {
        // 클릭해서 체크 됐을 때
        if(e.target.checked){
          // 5개 까지만 배열에 삽입
          if(selectMenus.length < 5){
            selectMenus.push(e.target.title);
            $menuText.innerHTML += countHTML.open + selectMenus.length + countHTML.close;
          }else{// 5개 넘었을 땐 얼럿. 체크되지 않도록
            alert("최대 5개까지 선택 가능합니다.");
            e.target.checked = false;
          }          
        }else{// 체크해제되면 배열에서 제거
          selectMenus.splice(selectMenus.indexOf(e.target.title),1);
          $menuText.removeChild($menuText.childNodes[1])
        }        
        console.log(selectMenus);
      });
    });

    $defaultSetBtn.addEventListener("click", (e) => {
      defaultMenus = selectMenus;
      localStorage.setItem("storedDefault", defaultMenus);
      console.log(defaultMenus)
    });

    // 초기화 버튼 클릭
    $resetBtn.addEventListener("click", (e) => {
      $chkBoxes.forEach($chkBox => {
        $chkBox.checked = false;
        const $numText = $chkBox.parentElement.querySelector("span.num");
        if($numText){
          $numText.outerHTML ="";
        }        
        selectMenus = [];
                
        const $menuText = $chkBox.parentElement.querySelector("span");
        if(localStorage.getItem("storedDefault")){
          $chkBox.checked = false;

          selectMenus = localStorage.getItem("storedDefault").split(",")
          let  i = 1;
          selectMenus.forEach(selectMenu => {
            if(selectMenu == $menuText.innerHTML){
              $chkBox.checked = true;
              $menuText.innerHTML += countHTML.open + i + countHTML.close;
            }
            i++;
          });
        }
      });
    });

    // 설정 완료 버튼 클릭 
    $setupBtn.addEventListener("click", (e) => {
      console.log(selectMenus);
      if(selectMenus.length > 0){        
        localStorage.setItem("storedMenu", selectMenus);
        drawListFuncs(selectMenus);
      }else{
        drawListFuncs(defaultMenus);
        localStorage.removeItem("storedMenu");
      }
      addClass($ajaxArea, "hidden");
    });

    // 레이어 닫기 클릭
    $closeBtn.addEventListener("click", (e) => {
      if(!localStorage.getItem("storedMenu")){
        $chkBoxes.forEach($chkBox => {
          $chkBox.checked = false;
        });
      }
      addClass($ajaxArea, "hidden");
    });
  }

  //페이지 로드했을떄 이전에 선택했던 내용있으믄 그대로.
  window.addEventListener('DOMContentLoaded', function(){
    const storageMenu = localStorage.getItem("storedMenu");
    if(storageMenu){
      let selectMenus = storageMenu.split(",")
      console.log(selectMenus)
      
      drawListFuncs(selectMenus);
    }

    // 팝업도 안보이는 상태로 불러와서, 선택했던 내용 표시해주기
    makeAjaxRequest($ajaxArea, "GET", "setting.html");
    addClass($ajaxArea, "hidden");
  });

  //설정 후.
  document.addEventListener("click", (e) => {    
    if(e.target.tagName === "BUTTON" && e.target.parentElement.dataset.role === "setting"){
      const $ajaxArea = document.querySelector("[data-role='ajax-area']");
      removeClass($ajaxArea, "hidden");
    }
  });

  function drawListFuncs(arr){
    removeInnerHTML($menuArea);      
    loopHTML(arr, $menuArea, listHTML.open, listHTML.close);
    $menuArea.innerHTML += btnSettingHTML;  
  }
})();

function removeClass(el, className){
  el.className = el.className.replace(" "+className,"");
}

function addClass(el, className){
  el.className += " "+className;
}

function removeInnerHTML(el){
  el.innerHTML = "";
}

function loopHTML(arr, el, openHTML, closeHTML){
  arr.forEach(item => {
    el.innerHTML += openHTML + item + closeHTML;
  });     
}
