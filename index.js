//시계
function updateClock() {
  let now = moment();
  let timeString = now.format('A h:mm');
  $('.time').text(timeString);
}
moment.locale('ko');
updateClock();
//10초마다 업데이트
setInterval(updateClock, 10000);

/* =========================
   프레임 내부 전환 (메인 페이지만)
========================= */
const PAGES = ['#home_index', '#add_index', '#bookmark_index', '#save_index'];
let currentPage = '#home_index';
let isTransitioning = false;

// "프레임 내부 컨텐츠" 선택자
function getInner(pageEl) {
  const overlayEl = pageEl.find('.save_overlay');
  if (overlayEl.length) {
    return overlayEl;
  }

  const app2El = pageEl.find('.app_');
  if (app2El.length) {
    return app2El;
  }

  return pageEl.find('.app');
}

function initPages(start = '#home_index') {
  currentPage = start;

  PAGES.forEach(function (sel) {
    const pageEl = $(sel);
    if (sel === start) {
      pageEl.show();
      getInner(pageEl).css({ opacity: 1, transform: 'translateX(0)' });
    } else {
      pageEl.hide();
      getInner(pageEl).css({ opacity: 0, transform: 'translateX(12px)' });
    }
  });

  closeSearchOverlay(true);
  closeAddTagOverlay(true);
}

function goPage(target, dir = 'left') {
  if (isTransitioning) {
    return;
  }
  if (!target || target === currentPage) {
    return;
  }

  isTransitioning = true;

  const fromPageEl = $(currentPage);
  const toPageEl = $(target);

  const fromInnerEl = getInner(fromPageEl);
  const toInnerEl = getInner(toPageEl);

  const inX = (dir === 'left') ? '12px' : '-12px';
  const outX = (dir === 'left') ? '-12px' : '12px';

  toPageEl.show();

  toInnerEl.stop(true, true).css({
    opacity: 0,
    transform: `translateX(${inX})`,
    transition: 'transform 260ms ease'
  });

  fromInnerEl.css({ transition: 'transform 220ms ease' });
  fromInnerEl.stop(true, true).animate({ opacity: 0 }, 200);
  fromInnerEl.css({ transform: `translateX(${outX})` });

  toInnerEl.stop(true, true).animate({ opacity: 1 }, 240);
  toInnerEl.css({ transform: 'translateX(0)' });

  setTimeout(function () {
    fromPageEl.hide();
    fromInnerEl.css({ opacity: 1, transform: 'translateX(0)', transition: '' });
    toInnerEl.css({ transition: '' });

    currentPage = target;
    isTransitioning = false;
  }, 280);
}

/* =========================
   검색창, 태그 추가 오버레이
========================= */
let prevPageForOverlay = '#bookmark_index';

function openSearchOverlay(fromPage) {
  prevPageForOverlay = fromPage || currentPage;

  if (prevPageForOverlay === '#home_index') {
    $('.search_page').css('margin-top', '339px');
  } else {
    $('.search_page').css('margin-top', '58px');
  }

  $('#search_index')
    .show()
    .css({ 'z-index': 9999, 'pointer-events': 'auto' })
    .hide()
    .fadeIn(160);
}

function closeSearchOverlay(immediate = false) {
  if (immediate) {
    $('.search_page').css('margin-top', '58px');
    $('#search_index').hide().css({ 'z-index': -10, 'pointer-events': 'none' });
    return;
  }
  $('#search_index').fadeOut(140, function () {
    $(this).css({ 'z-index': -10, 'pointer-events': 'none' });
    $('.search_page').css('margin-top', '58px');
  });
}

function openAddTagOverlay() {
  $('#add_tag_index')
    .show()
    .css({ 'z-index': 10000, 'pointer-events': 'auto' })
    .hide()
    .fadeIn(160);
}

function closeAddTagOverlay(immediate = false) {
  if (immediate) {
    $('#add_tag_index').hide().css({ 'z-index': -10, 'pointer-events': 'none' });
    return;
  }
  $('#add_tag_index').fadeOut(140, function () {
    $(this).css({ 'z-index': -10, 'pointer-events': 'none' });
  });
}

/* =========================
   툭툭툭 애니메이션 트리거 (공용)
========================= */
function applyPopAnimation(containerEl) {
  const items = containerEl.find(".swipe_item");
  if (items.length === 0) {
    return;
  }

  items.each(function (i) {
    const itemEl = $(this);
    itemEl
      .removeClass("pop")
      .css("animation-delay", (i * 60) + "ms")
      .addClass("pop");
  });
}

/* =========================
   스와이프 상태에 맞춰 화살표 바꾸기
   - 닫힘: left_arrow.svg
   - 열림: right_arrow.svg
========================= */
function syncSwipeArrow(swipeItemEl, withPop = true) {
  const arrowEl = swipeItemEl.find('.item_go');
  if (!arrowEl.length) {
    return;
  }

  const isOpen = swipeItemEl.hasClass('open');
  const nextSrc = isOpen ? 'img/right_arrow.svg' : 'img/left_arrow.svg';

  const curSrc = arrowEl.attr('src') || '';
  if (curSrc.indexOf(nextSrc) !== -1) {
    return;
  }

  arrowEl.attr('src', nextSrc);

  if (withPop) {
    arrowEl.removeClass('arrow-pop');
    if (arrowEl[0]) {
      void arrowEl[0].offsetWidth; // reflow
    }
    arrowEl.addClass('arrow-pop');
  }
}

/* =========================
   앱 로직
========================= */
$(function () {
  initPages('#home_index');

  // 하단 네비
  $(document).on('click', '.navigation .home', function () {
    closeSearchOverlay();
    closeAddTagOverlay();
    goPage('#home_index', 'right');
  });

  $(document).on('click', '.navigation .add', function () {
    closeSearchOverlay();
    closeAddTagOverlay();
    goPage('#add_index', 'left');
  });

  $(document).on('click', '.navigation .bookmark', function () {
    closeSearchOverlay();
    closeAddTagOverlay();
    goPage('#bookmark_index', 'left');
    updateWebFilter();
    renderBookmarks();
  });

  /* ===== 검색 오버레이 열기 ===== */
  $(document).on('click', '#bookmark_index .search_bar', function () {
    openSearchOverlay('#bookmark_index');
  });

  $(document).on('click', '#home_index .search_bar', function () {
    openSearchOverlay('#home_index');
  });

  $(document).on('click', '#search_index .phone', function () {
    closeSearchOverlay();
  });

  $(document).on('click', '#search_index .search_page', function (e) {
    e.stopPropagation();
  });

  $(document).on('click focus', '#search_index .search', function (e) {
    e.stopPropagation();
  });

  $(document).on('click focus', '#home_index .search, #bookmark_index .search', function (e) {
    e.stopPropagation();
  });

  $(document).on('click', '#search_index .add_tag button', function (e) {
    e.stopPropagation();
    openAddTagOverlay();
  });

  $(document).on('click', '#add_tag_index .phone', function () {
    closeAddTagOverlay();
  });

  $(document).on('click', '#add_tag_index #add_tag_page', function (e) {
    e.stopPropagation();
  });

  $(document).on('click', '#add_tag_index .cancel_btn', function () {
    closeAddTagOverlay();
  });

  /* ===== 저장 완료 모달 버튼 ===== */
  $(document).on('click', '#save_index #list_btn', function () {
    goPage('#bookmark_index', 'right');
    updateWebFilter();
    renderBookmarks();
  });

  $(document).on('click', '#save_index #ok_btn, #save_index .save_close', function () {
    goPage('#add_index', 'right');
  });

  /* ===== 저장하기 버튼 (Gemini) ===== */
  $('#save_btn').on('click', function () {
    let url = $('#input_url').val().trim();
    if (!url) {
      alert("URL을 입력해주세요.");
      return;
    }

    let originalBtnText = $(this).html();
    $(this)
      .html(`<img src="img/loading.gif" alt="" width="18px" style="margin-right:8px; vertical-align:middle;"> 분석 중...`)
      .prop("disabled", true);

    geminiAi(url, $(this), originalBtnText);
  });

  /* ===== 필터 선택 ===== */
  $('#web_filter').on('click', '.category, .selected_category', function () {
    $('#web_filter .selected_category').removeClass('selected_category').addClass('category');
    $(this).removeClass('category').addClass('selected_category');
    let selectedWebsite = $(this).find('p').text().trim();
    renderBookmarks(selectedWebsite);
  });

  /* ===== 삭제 버튼 ===== */
  $(document).on('click', '.delete_btn', function (e) {
    e.stopPropagation();
    let index = $(this).data('index');
    let saved = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    saved.splice(index, 1);
    localStorage.setItem('bookmarks', JSON.stringify(saved));
    renderBookmarks();
  });

  /* ===== 카드 접힘/펼침 (화살표 제외) ===== */
  $(document).on('click', '.item_header', function (e) {
    if (clickBlocked) return; // 스와이프 직후 클릭 방지

    if ($(e.target).closest('.item_go').length > 0) {
      return;
    }
    $(this).closest('.bookmark_item').toggleClass('collapsed');
  });

  /* 클릭해서 삭제하는 버튼 없앰 (사유 : 스와이프 구현)*/
  /*
  $(document).on('click', '.item_go', function (e) {
    e.preventDefault();
    e.stopPropagation();

    let swipeEl = $(this).closest('.swipe_item');
    $('.swipe_item').not(swipeEl).removeClass('open');
    swipeEl.toggleClass('open');
  });
  */

  /* ===== 바깥 클릭 -> 열린 삭제 패널 닫기 + 화살표 복귀 ===== */
  $(document).on('click', function (e) {
    if ($(e.target).closest('.swipe_item').length === 0) {
      $('.swipe_item.open').each(function () {
        const swipeItemEl = $(this);
        swipeItemEl.removeClass('open');
        syncSwipeArrow(swipeItemEl, false);
      });
    }
  });

  /* ===== 검색 태그 체크박스 UI ===== */
  $("#search_filter input[type=checkbox]").checkboxradio({ icon: false });

  /* ===== 모든 검색 input 동기화 ===== */
  $(document).on('input', '.search', function () {
    let keyword = $(this).val();
    $('.search').val(keyword);

    let currentWebsite = $('#web_filter .selected_category p').text() || '전체';
    renderBookmarks(currentWebsite);
  });

  /* ===== 엔터 검색 (오버레이 닫기 포함) ===== */
  $(document).on('keypress', '.search', function (e) {
    if (e.which === 13) {
      e.preventDefault();

      let searchText = $(this).val().trim();
      if (!searchText) {
        return;
      }

      searchBookmarks(searchText);
      closeSearchOverlay();

      if (currentPage !== '#bookmark_index') {
        goPage('#bookmark_index', 'left');
        updateWebFilter();
      }
    }
  });

  /* ===== 태그 로딩 ===== */
  loadTags();

  $("#search_filter").on("change", "input[type=checkbox]", function () {
    let id = $(this).attr("id");
    let labelEl = $("label[for='" + id + "']");
    let tagText = labelEl.text();

    if ($(this).is(":checked")) {
      if ($(".selected_tag .selected-item").length >= 1) {
        alert("태그는 하나만 선택 가능합니다.");
        $(this).prop("checked", false).checkboxradio("refresh");
        return;
      }

      if ($(".selected_tag .selected-item[data-id='" + id + "']").length === 0) {
        $(".selected_tag").append(
          '<div class="selected-item" data-id="' + id + '">' + tagText + '</div>'
        );
      }
    } else {
      $(".selected_tag .selected-item[data-id='" + id + "']").remove();
    }

    if ($(".selected_tag .selected-item").length > 0) {
      $(".selected_tag img").hide();
      $('.selected_tag').css('margin-left', '-10px');
    } else {
      $(".selected_tag img").show();
      $('.selected_tag').css('margin-left', '0px');
    }

    let currentWebsite = $('#web_filter .selected_category p').text() || '전체';
    renderBookmarks(currentWebsite);

    if (currentPage !== '#bookmark_index') {
      goPage('#bookmark_index', 'left');
      updateWebFilter();
      closeSearchOverlay();
    }
  });

  /* ===== 커스텀 태그 추가 ===== */
  $(document).on('click', '.add_tag_btn', function () {
    let tagName = $('.add_tag_input').val().trim();
    if (!tagName) {
      alert("태그 이름을 입력해주세요.");
      return;
    }

    let customTagData = JSON.parse(localStorage.getItem("customTags") || '{"tags":[]}');
    if (!customTagData.tags || !Array.isArray(customTagData.tags)) {
      customTagData = { tags: [] };
    }

    let savedTags = customTagData.tags;

    if (savedTags.includes(tagName)) {
      alert("이미 존재하는 태그입니다.");
      return;
    }

    savedTags.push(tagName);
    localStorage.setItem("customTags", JSON.stringify({ tags: savedTags }));

    loadTags();
    $(".add_tag_input").val("");
    closeAddTagOverlay();
  });
});

/* =========================
   제미나이 호출
========================= */
function geminiAi(urlinput, btnEl, originalBtnText) {
  let apiKey = localStorage.getItem('gemini_api_key') || $('#api_key_input').val().trim();
  let prompt = `
    다음 링크의 내용을 아래 내용에 따라 분석해줘: ${urlinput}

    1. 해당 페이지의 "제목(Title)"을 추출해. 제목은 공백 포함 25자 이내로 작성.
    2. 핵심 내용을 3문장으로 "요약(Summary)"해. 한 문장은 공백 포함 70자 이내로 작성.
    3. 핵심 '명사 키워드' 5개를 뽑아 keywords 배열로 제공(중복/조사 제외).
    4. 적절한 "카테고리(Category)"를 하나 정해 (IT, 정치, 경제, 요리, 운동, 언어, 공부, 사회, 연예 등 관련 주제로)
    5. 웹사이트 이름을 추출해 (Ex: 네이버 블로그, 네이버 뉴스, 유튜브, 인스타그램, 티스토리, 레딧 등)
    6. 추출하는 시간을 YYYY.mm.dd HH:mm 형태로 추출
    7. 결과는 반드시 아래와 같은 JSON 형식으로 출력해 마크다운 없이 순수 JSON만.

    {
      "title": "제목 내용",
      "summary": "요약 내용",
      "keywords": ["키워드1","키워드2","키워드3","키워드4","키워드5"],
      "category": "카테고리",
      "website" : "웹사이트이름",
      "time" : "YYYY.mm.dd HH:mm"
    }
  `;

  let geminiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=" +
    apiKey;

  $.ajax({
    url: geminiUrl,
    type: "POST",
    headers: { "Content-Type": "application/json" },
    data: JSON.stringify({
      "contents": [{ "parts": [{ "text": prompt }] }],
      "tools": [{ "url_context": {} }]
    }),
    success: function (response) {
      let geminiResponse = response.candidates[0].content.parts[0].text;
      let jsonStartIndex = geminiResponse.indexOf('{');
      let jsonEndIndex = geminiResponse.lastIndexOf('}') + 1;
      let cleanJson = geminiResponse.substring(jsonStartIndex, jsonEndIndex);
      let result = JSON.parse(cleanJson);

      let article = {
        url: urlinput,
        title: result.title,
        summary: result.summary,
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        category: result.category,
        website: result.website,
        time: moment().format("YYYY.MM.DD HH:mm"),
        date: new Date().toLocaleDateString()
      };

      let saved = JSON.parse(localStorage.getItem('bookmarks') || '[]');
      saved.unshift(article);
      localStorage.setItem('bookmarks', JSON.stringify(saved));

      updateWebFilter(); //웹사이트 목록 갱신
      loadTags(); // 태그 목록 갱신
      $('#input_url').val('');

      goPage('#save_index', 'left');
      saveAni();
    },
    error: function (xhr, status, error) {
      alert('분석 중 오류가 발생했습니다. URL을 다시 확인해 주세요.');
      console.error("API 호출 에러:", status, error);
      console.error("응답 내용:", xhr.responseText);
    },
    complete: function () {
      btnEl.html(originalBtnText).prop("disabled", false);
    }
  });
}

/* =========================
   추천 로직
========================= */
function getRecommend(saved, baseIndex, limit) {
  limit = limit || 3;

  let baseBookmark = saved[baseIndex];
  let baseKeywords = baseBookmark.keywords || [];
  if (baseKeywords.length === 0) {
    return [];
  }

  let result = [];

  for (let i = 0; i < saved.length; i++) {
    if (i === baseIndex) {
      continue;
    }

    let target = saved[i];
    let targetKeywords = target.keywords || [];

    let sameCount = 0;
    baseKeywords.forEach(function (key) {
      if (targetKeywords.includes(key)) sameCount++;
    });

    if (sameCount > 0) {
      result.push({ item: target, score: sameCount });
    }
  }

  result.sort(function (a, b) {
    return b.score - a.score;
  });
  return result.slice(0, limit);
}

/* =========================
   북마크 렌더링
========================= */
function renderBookmarks(filterText = '전체') {
  let saved = JSON.parse(localStorage.getItem('bookmarks') || '[]');
  $("#bookmark_content").empty();

  let filteredList = saved;

  // 1) 웹사이트 필터
  if (filterText !== '전체') {
    filteredList = saved.filter(function (item) {
      return item.website && item.website.includes(filterText);
    });
  }

  // 2) 태그(카테고리) 필터
  let selectedTags = [];
  $(".selected_tag .selected-item").each(function () {
    selectedTags.push($(this).text().replace('#', '').trim());
  });

  if (selectedTags.length > 0) {
    filteredList = filteredList.filter(function (item) {
      return selectedTags.includes(item.category);
    });
  }

  if (filteredList.length === 0) {
    $("#bookmark_content").append(`<p style="padding:20px; text-align:center; color:#888;"> 북마크가 없습니다.</p>`);
    return;
  }

  let lastDateGroup = null;
  let today = moment().startOf('day');
  let yesterday = moment().subtract(1, 'days').startOf('day');

  filteredList.forEach(function (item, index) {
    let itemTime = item.time ? moment(item.time, "YYYY.MM.DD HH:mm") : moment();
    let itemDate = itemTime.startOf('day');
    let dateLabel = "";

    if (itemDate.isSame(today)) dateLabel = "오늘";
    else if (itemDate.isSame(yesterday)) dateLabel = "어제";
    else dateLabel = itemTime.format("YYYY.MM.DD");

    if (dateLabel !== lastDateGroup) {
      $("#bookmark_content").append(`<h2 class="day_title">${dateLabel}</h2>`);
      lastDateGroup = dateLabel;
    }

    let collapsedClass = ' collapsed';
    if (index === 0 && filterText === '전체') collapsedClass = '';

    let title = item.title || "제목 없음";
    let summary = item.summary || "요약 내용이 없습니다.";
    let category = item.category || "기타";
    let time = item.time || "시간";
    let website = item.website || "Web";
    let url = item.url || "#";

    let baseIndex = saved.indexOf(item);

    let recommends = getRecommend(saved, baseIndex, 3);
    let recommendHTML = "";

    if (recommends.length === 0) {
      recommendHTML = `<p>유사한 북마크가 아직 없습니다.</p>`;
    } else {
      recommendHTML = "<ul>";
      recommends.forEach(function (rec) {
        recommendHTML += `
          <li>
            <a href="${rec.item.url}" target="_blank">${rec.item.title}</a>
          </li>
        `;
      });
      recommendHTML += "</ul>";
    }

    // 기본(닫힘) 상태: left_arrow.svg
    let html = `
      <div class="swipe_item">
        <div class="swipe_actions">
          <button class="swipe_delete delete_btn" data-index="${baseIndex}">
            <img src="img/delete.svg" alt="">
            <span>삭제</span>
          </button>
        </div>

        <div class="swipe_content">
          <div class="bookmark_item${collapsedClass}">
            <div class="item_header">
              <span class="item_category">[${category}]</span>
              <a href="${url}" class="item_title" target="_blank">${title}</a>
              <span class="item_url">${url}</span>
              <span class="item_time">${website} | ${time}</span>
              <img class="item_go" src="img/left_arrow.svg" alt="">
            </div>

            <div class="item_footer">
              <div class="summary_box">
                <div class="summary_title">
                  <img src="img/ai.svg" alt=""><h1>3줄 요약</h1>
                </div>
                <p class="summary">${summary}</p>
              </div>

              <div class="recommend_box">
                <div class="recommend_title">
                  <h1>관련 북마크 추천</h1><img src="img/check.svg" alt="">
                </div>
                ${recommendHTML}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    $("#bookmark_content").append(html);
  });

  applyPopAnimation($("#bookmark_content"));
}

/* =========================
   검색 결과 렌더
========================= */
function searchBookmarks(searchText) {
  let saved = JSON.parse(localStorage.getItem('bookmarks') || '[]');
  $("#bookmark_content").empty();

  let searchKeywords = searchText.split(/\s+/);

  let matchedList = saved.filter(function (item) {
    let title = (item.title || "").toLowerCase();
    let summary = (item.summary || "").toLowerCase();
    let category = (item.category || "").toLowerCase();
    let website = (item.website || "").toLowerCase();
    let url = (item.url || "").toLowerCase();
    let keywords = Array.isArray(item.keywords) ? item.keywords : [];

    for (let i = 0; i < searchKeywords.length; i++) {
      let term = searchKeywords[i].toLowerCase();

      if (title.includes(term) || summary.includes(term) || category.includes(term) || website.includes(term) || url.includes(term)) {
        return true;
      }
      let matchKeyword = keywords.some(function (k) {
        return k.toLowerCase().includes(term);
      });
      if (matchKeyword) return true;
    }
    return false;
  });

  if (matchedList.length === 0) {
    $("#bookmark_content").append(`
      <p style="padding:20px; text-align:center; color:#888;">
        검색 결과가 없습니다.
      </p>
    `);
    return;
  }

  matchedList.forEach(function (item) {
    let title = item.title || "제목 없음";
    let summary = item.summary || "요약 없음";
    let category = item.category || "기타";
    let time = item.time || "";
    let website = item.website || "";
    let url = item.url || "#";

    let baseIndex = saved.indexOf(item);

    let recommends = getRecommend(saved, baseIndex, 3);
    let recommendHTML = "";

    if (recommends.length === 0) {
      recommendHTML = `<p>유사한 북마크가 아직 없습니다.</p>`;
    } else {
      recommendHTML = "<ul>";
      recommends.forEach(function (rec) {
        recommendHTML += `
          <li>
            <a href="${rec.item.url}" target="_blank">${rec.item.title}</a>
          </li>
        `;
      });
      recommendHTML += "</ul>";
    }

    // 기본(닫힘) 상태: left_arrow.svg
    let html = `
      <div class="swipe_item">
        <div class="swipe_actions">
          <button class="swipe_delete delete_btn" data-index="${baseIndex}">
            <img src="img/delete.svg" alt="">
            <span>삭제</span>
          </button>
        </div>

        <div class="swipe_content">
          <div class="bookmark_item">
            <div class="item_header">
              <span class="item_category">[${category}]</span>
              <a href="${url}" class="item_title" target="_blank">${title}</a>
              <span class="item_url">${url}</span>
              <span class="item_time">${website} | ${time}</span>
              <img class="item_go" src="img/left_arrow.svg" alt="">
            </div>

            <div class="item_footer">
              <div class="summary_box">
                <div class="summary_title">
                  <img src="img/ai.svg" alt=""><h1>3줄 요약</h1>
                </div>
                <p class="summary">${summary}</p>
              </div>

              <div class="recommend_box">
                <div class="recommend_title">
                  <h1>관련 북마크 추천</h1><img src="img/check.svg" alt="">
                </div>
                ${recommendHTML}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    $("#bookmark_content").append(html);
  });

  applyPopAnimation($("#bookmark_content"));
}

/* =========================
   필터 생성
========================= */
function updateWebFilter() {
  let saved = JSON.parse(localStorage.getItem('bookmarks') || '[]');
  $('#web_filter').empty();

  let currentSelected = $('#web_filter').find('.selected_category p').text() || '전체';
  let defaultCategories = ['전체'];

  let dynamicCategories = new Set(defaultCategories);
  saved.forEach(function (item) {
    if (item.website) dynamicCategories.add(item.website);
  });

  $('#web_filter').empty();

  dynamicCategories.forEach(function (category) {
    let className = (category === currentSelected) ? 'selected_category' : 'category';
    let html = `
      <div class="${className}" data-value="${category}">
        <p>${category}</p>
      </div>
    `;
    $('#web_filter').append(html);
  });
}

/* =========================
   태그 로딩
========================= */
function loadTags() {
  let defaultTags = ['기타'];

  let savedBookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
  if (!Array.isArray(savedBookmarks)) savedBookmarks = [];
  let bookmarkCategories = savedBookmarks.map(function (item) { return item.category; }).filter(function (c) { return c; });

  let customTags = [];
  let parsed = JSON.parse(localStorage.getItem("customTags") || '{"tags":[]}');

  if (Array.isArray(parsed)) customTags = parsed;
  else if (parsed && Array.isArray(parsed.tags)) customTags = parsed.tags;
  else customTags = [];

  let allTags = new Set([...defaultTags, ...bookmarkCategories, ...customTags]);

  let addTagBtnEl = $("#search_filter .add_tag");
  if (addTagBtnEl.length === 0) {
    return;
  }

  addTagBtnEl.prevAll().remove();

  let index = 1;
  allTags.forEach(function (tag) {
    let id = "tag_dynamic_" + index++;
    let html = `
      <input type="checkbox" name="tag" id="${id}">
      <label for="${id}">#${tag}</label>
    `;
    $(html).insertBefore(addTagBtnEl);
    $("#" + id).checkboxradio({ icon: false });
  });
}

/* =========================
   스와이프 가능하게 하는 코드
========================= */
let swipeStartX = 0;
let swipeStartY = 0;
let isSwiping = false;
let clickBlocked = false; // 클릭 방지 추가
let currentSwipeItem = null;

// 터치 시작
$(document).on('touchstart mousedown', '.swipe_content', function (e) {
  const point = e.touches ? e.touches[0] : e;

  swipeStartX = point.clientX;
  swipeStartY = point.clientY;
  isSwiping = false;
  currentSwipeItem = $(this).closest('.swipe_item');
});

// 터치 이동
$(document).on('touchmove mousemove', function (e) {
  if (!currentSwipeItem) {
    return;
  }

  const point = e.touches ? e.touches[0] : e;
  const diffX = point.clientX - swipeStartX;
  const diffY = point.clientY - swipeStartY;

  // 세로 스크롤이면 무시
  if (Math.abs(diffY) > Math.abs(diffX)) {
    return;
  }

  // 스와이프 시작 판단
  if (Math.abs(diffX) > 10) {
    isSwiping = true;
    // 픽(Peek) 애니메이션 잔여 스타일 제거 (CSS 클래스 우선순위 보장)
    if (currentSwipeItem) {
      currentSwipeItem.find('.swipe_content').css('transform', '');
    }
  }

  if (!isSwiping) {
    return;
  }

  e.preventDefault(); // 가로 스와이프 시 스크롤 방지

  // 왼쪽으로 밀기 -> 열기
  if (diffX < -40) {
    $('.swipe_item').not(currentSwipeItem).removeClass('open').each(function () {
      syncSwipeArrow($(this), false);
    });

    currentSwipeItem.addClass('open');
    syncSwipeArrow(currentSwipeItem, true);
  }

  // 오른쪽으로 밀기 -> 닫기
  if (diffX > 40) {
    currentSwipeItem.removeClass('open');
    syncSwipeArrow(currentSwipeItem, true);
  }
});

// 터치 종료
$(document).on('touchend mouseup mouseleave', function () {
  if (isSwiping) {
    clickBlocked = true;
    setTimeout(() => {
      clickBlocked = false;
    }, 100); // 100ms 동안 클릭 차단
  }
  currentSwipeItem = null;
  isSwiping = false;
});

// 저장 아이콘 애니메이션
function saveAni() {
  $('.document').delay(120).animate({ 'top': '70px' }, 300).delay(10).animate({ 'top': '60px' }, 100);
  $('.effect').delay(120).animate({ 'scale': '3' }, 300).delay(10).animate({ 'scale': '2.6' }, 100);
}

$(function () {
  $('#demo_btn').click(function () {

    $('#save_btn')
      .html(`<img src="img/loading.gif" alt="" width="18px" style="margin-right:8px; vertical-align:middle;"> 분석 중...`)

    setTimeout(function () {
      $('#save_btn')
        .html(`<img src="img/save.svg" alt="">저장하기`)

      goPage('#save_index', 'left')
      saveAni();
    }, 640);
  });

  // API Key 관리
  let savedKey = localStorage.getItem('gemini_api_key');
  if (savedKey) {
    $('#api_key_input').val(savedKey);
  }

  $('#api_key_input').on('input', function () {
    localStorage.setItem('gemini_api_key', $(this).val().trim());
  });

  $('#api_key_save_btn').click(function (e) {
    e.stopPropagation();
    let key = $('#api_key_input').val().trim();
    if (key) {
      localStorage.setItem('gemini_api_key', key);
      alert("API Key가 저장되었습니다.");
    } else {
      alert("API Key를 입력해주세요.");
    }
  });
});

/* =========================
   드래그 및 선택 방지
========================= */
$(document).on('dragstart', function () {
  return false;
});

$(document).on('selectstart', function (e) {
  if ($(e.target).is('input, textarea')) {
    return true;
  }
  return false;
});

/* =========================
   우측 호버 애니메이션
   ========================= */
$(document).on('mousemove', '.swipe_content', function (e) {
  // 스와이프 중이거나, 이미 열려있으면 실행 X
  if (isSwiping) return;
  if (e.buttons > 0) return; // 드래그 중(클릭 상태)이면 실행 X
  let parent = $(this).closest('.swipe_item');
  if (parent.hasClass('open')) return;

  let swipeRect = this.getBoundingClientRect();
  //카드 오른쪽 - 마우스 x 좌표
  let mouseRight = swipeRect.right - e.clientX;

  // 오른쪽 50px 이내면 10px 밀기 
  if (mouseRight < 50 && mouseRight >= 0) {
    $(this).css('transform', 'translateX(-10px)');
  } else {
    // 그 외 영역이면 원상복귀
    $(this).css('transform', '');
  }
});
// 마우스 떠나면 초기화
$(document).on('mouseleave', '.swipe_content', function () {
  if (isSwiping) return;


  $(this).css('transform', '');
});


