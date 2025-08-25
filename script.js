// 全局状态管理
let playlistData = [];      // 原始歌单数据
let filteredData = [];      // 过滤后的数据（用于渲染表格）
let formModified = false;   // 表单修改状态
// 当前排序状态
let currentSort = {
  field: 'id',
  direction: 'asc' // 'asc' 或 'desc'
};

// 当前过滤条件
let currentFilters = {
  language: '',
  genre: ''
};


document.addEventListener('DOMContentLoaded', async () => {
  // 1. 加载歌单数据
  await loadPlaylistData();
  // 初始化页面
  initPage();
  // 初始化浮动按钮
  initFloatingButtons();
  
  // 初始化事件监听器
  initEventListeners();
});

async function loadPlaylistData() {
  try {
      const response = await fetch('./playlist.json');
      if (!response.ok) throw new Error('数据请求失败');
      
      playlistData = await response.json();
      filteredData = [...playlistData];
      
      console.log('歌单数据加载成功，共', playlistData.length, '首歌曲');
  } catch (error) {
      // 创建默认的空歌单数据
      playlistData = [];
      filteredData = [];
      console.warn('无法加载playlist.json，使用空歌单:', error.message);
      
      // 可选：显示用户友好的提示
      const toast = document.createElement('div');
      toast.style.cssText = 'position:fixed; top:20px; right:20px; background:#f44336; color:white; padding:15px; border-radius:5px; z-index:10000;';
      toast.textContent = '无法加载歌单数据，请检查playlist.json文件';
      document.body.appendChild(toast);
      
      setTimeout(() => document.body.removeChild(toast), 5000);
  }
}
// 初始化页面
function initPage() {
  // 渲染歌单表格
  renderPlaylist();
  
  // 更新统计信息
  updateStats();
  
  // 初始化排序图标
  updateSortIcons();
}

// 初始化事件监听器
function initEventListeners() {
  // 搜索表单提交
  document.getElementById('search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    performSearch();
  });
  
  // 过滤器变化
  document.getElementById('language-filter').addEventListener('change', function() {
    currentFilters.language = this.value;
    applyFilters();
  });
  
  document.getElementById('genre-filter').addEventListener('change', function() {
    currentFilters.genre = this.value;
    applyFilters();
  });
  
  // 操作按钮点击事件
  document.getElementById('add-song').addEventListener('click', showAddSongModal);
  document.getElementById('advanced-search').addEventListener('click', showAdvancedSearchModal);
  document.getElementById('statistics').addEventListener('click', showStatisticsModal);
  document.getElementById('export-playlist').addEventListener('click', showExportModal);
  document.getElementById('clear-playlist').addEventListener('click', confirmClearPlaylist);
  document.getElementById('table-settings').addEventListener('click', showTableSettingsModal);
  
  // 排序点击事件
  const sortableHeaders = document.querySelectorAll('.sortable-column');
  sortableHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const sortField = this.dataset.sort;
      toggleSort(sortField);
    });
  });
  
  // 表单相关事件
  initFormEvents();
  
  // 确认对话框事件
  initConfirmationDialog();
}

// 初始化表单事件
function initFormEvents() {
  // 添加歌曲表单
  const songForm = document.getElementById('song-form');
  songForm.addEventListener('submit', function(e) {
    e.preventDefault();
    addNewSong();
  });
  
  // 编辑歌曲表单
  const editSongForm = document.getElementById('edit-song-form');
  editSongForm.addEventListener('submit', function(e) {
    e.preventDefault();
    updateSong();
  });
  
  // 高级搜索表单
  const advancedSearchForm = document.getElementById('advanced-search-form');
  advancedSearchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    performAdvancedSearch();
  });
  
  // 关闭按钮事件
  document.getElementById('modal-close-button').addEventListener('click', function() {
    confirmCloseForm('add-song-modal');
  });
  
  document.getElementById('form-cancel-button').addEventListener('click', function() {
    confirmCloseForm('add-song-modal');
  });
  
  document.getElementById('edit-modal-close-button').addEventListener('click', function() {
    confirmCloseForm('edit-song-modal');
  });
  
  document.getElementById('edit-cancel-button').addEventListener('click', function() {
    confirmCloseForm('edit-song-modal');
  });
  
  document.getElementById('advanced-search-close-button').addEventListener('click', function() {
    hideModal('advanced-search-modal');
  });
  
  document.getElementById('advanced-search-cancel-button').addEventListener('click', function() {
    hideModal('advanced-search-modal');
  });
  
  document.getElementById('statistics-close-button').addEventListener('click', function() {
    hideModal('statistics-modal');
  });
  
  document.getElementById('statistics-close-btn').addEventListener('click', function() {
    hideModal('statistics-modal');
  });
  
  document.getElementById('export-close-button').addEventListener('click', function() {
    hideModal('export-modal');
  });
  
  document.getElementById('export-cancel-button').addEventListener('click', function() {
    hideModal('export-modal');
  });
  
  document.getElementById('table-settings-close-button').addEventListener('click', function() {
    hideModal('table-settings-modal');
  });
  
  document.getElementById('table-settings-cancel-button').addEventListener('click', function() {
    hideModal('table-settings-modal');
  });
  
  document.getElementById('confirmation-close-button').addEventListener('click', function() {
    hideModal('confirmation-modal');
  });
  
  document.getElementById('confirmation-cancel-button').addEventListener('click', function() {
    hideModal('confirmation-modal');
  });
  
  // 导出确认按钮
  document.getElementById('export-confirm-button').addEventListener('click', function() {
    const format = document.querySelector('input[name="export-format"]:checked').value;
    exportPlaylist(format);
  });
  
  // 表格设置保存按钮
  document.getElementById('table-settings-save-button').addEventListener('click', function() {
    saveTableSettings();
  });
  
  // 删除歌曲按钮
  document.getElementById('delete-song-button').addEventListener('click', function() {
    const songId = document.getElementById('edit-song-form').dataset.songId;
    confirmDeleteSong(songId);
  });
  
  // 表单输入变化监听
  const formInputs = document.querySelectorAll('#song-form input, #song-form select, #song-form textarea');
  formInputs.forEach(input => {
    input.addEventListener('input', function() {
      formModified = true;
    });
  });
  
  const editFormInputs = document.querySelectorAll('#edit-song-form input, #edit-song-form select, #edit-song-form textarea');
  editFormInputs.forEach(input => {
    input.addEventListener('input', function() {
      formModified = true;
    });
  });

  // 添加演唱者
  document.getElementById('add-performer').addEventListener('click', function() {
    addArrayItem('performers-container', 'performer', 'text', '输入演唱者姓名');
  });

  // 添加作词者
  document.getElementById('add-lyricist').addEventListener('click', function() {
    addArrayItem('lyricists-container', 'lyricist', 'text', '输入作词者姓名');
  });

  // 添加作曲者
  document.getElementById('add-composer').addEventListener('click', function() {
    addArrayItem('composers-container', 'composer', 'text', '输入作曲者姓名');
  });

  // 添加编曲者
  document.getElementById('add-arranger').addEventListener('click', function() {
    addArrayItem('arrangers-container', 'arranger', 'text', '输入编曲者姓名');
  });

  // 添加语言
  document.getElementById('add-language').addEventListener('click', function() {
    addLanguageItem();
  });

  // 添加风格
  document.getElementById('add-genre').addEventListener('click', function() {
    addArrayItem('genres-container', 'genre', 'text', '输入风格名称');
  });

  // 添加别名
  document.getElementById('add-alias').addEventListener('click', function() {
    const container = document.getElementById('aliases-container');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'array-item';
    
    const aliasDiv = document.createElement('div');
    aliasDiv.className = 'alias-fields';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.name = 'alias-title';
    titleInput.placeholder = '别名';
    titleInput.className = 'form-input';
    
    const languageSelect = document.createElement('select');
    languageSelect.name = 'alias-language';
    languageSelect.className = 'form-select';
    
    const languages = ['', '中文', '英语', '日语', '韩语', '未知'];
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang || '选择语言';
      languageSelect.appendChild(option);
    });
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-array-item';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', function() {
      container.removeChild(itemDiv);
    });
    
    aliasDiv.appendChild(titleInput);
    aliasDiv.appendChild(languageSelect);
    itemDiv.appendChild(aliasDiv);
    itemDiv.appendChild(removeBtn);
    container.appendChild(itemDiv);
  });

  // 添加视频
  document.getElementById('add-video').addEventListener('click', function() {
    addComplexArrayItem('videos-container', 'video', [
      { type: 'url', name: 'video-url', placeholder: '视频URL', label: 'URL' },
      { type: 'text', name: 'video-title', placeholder: '视频标题', label: '标题' },
      { 
        type: 'select', 
        name: 'video-type', 
        label: '类型',
        options: [
          { value: '官方', text: '官方' },
          { value: '翻唱', text: '翻唱' },
          { value: '其他', text: '其他' }
        ]
      },
      { type: 'text', name: 'video-note', placeholder: '备注', label: '备注' }
    ]);
  });

  // 添加直播回放
  document.getElementById('add-live').addEventListener('click', function() {
    addComplexArrayItem('lives-container', 'live', [
      { type: 'url', name: 'live-url', placeholder: '直播回放URL', label: 'URL' },
      { type: 'text', name: 'live-title', placeholder: '直播标题', label: '标题' },
      { type: 'date', name: 'live-date', placeholder: '日期', label: '日期' },
      { type: 'text', name: 'live-note', placeholder: '备注', label: '备注' }
    ]);
  });

  // 添加切片视频
  document.getElementById('add-clip').addEventListener('click', function() {
    addComplexArrayItem('clips-container', 'clip', [
      { type: 'url', name: 'clip-url', placeholder: '切片视频URL', label: 'URL' },
      { type: 'text', name: 'clip-title', placeholder: '切片标题', label: '标题' },
      { type: 'date', name: 'clip-date', placeholder: '日期', label: '日期' },
      { type: 'text', name: 'clip-note', placeholder: '备注', label: '备注' }
    ]);
  });
  // 导入歌单按钮
  document.getElementById('import-playlist').addEventListener('click', function() {
    showModal('import-modal');
  });

  // 导入确认按钮
  document.getElementById('import-confirm-button').addEventListener('click', function() {
    const fileInput = document.getElementById('file-input');
    if (fileInput.files.length === 0) {
      alert('请选择文件');
      return;
    }
    const file = fileInput.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      if (file.name.endsWith('.csv')) {
        importFromCSV(content);
      } else if (file.name.endsWith('.json')) {
        importFromJSON(content);
      } else {
        alert('不支持的文件格式');
      }
    };
    reader.readAsText(file);
  });

  // 导入取消按钮
  document.getElementById('import-cancel-button').addEventListener('click', function() {
    hideModal('import-modal');
  });

  // 导入关闭按钮
  document.getElementById('import-close-button').addEventListener('click', function() {
    hideModal('import-modal');
  });

  // 编辑表单的添加按钮事件
  document.getElementById('edit-add-performer').addEventListener('click', function() {
    addArrayItem('edit-performers-container', 'performer', 'text', '输入演唱者姓名', true);
  });

  document.getElementById('edit-add-lyricist').addEventListener('click', function() {
    addArrayItem('edit-lyricists-container', 'lyricist', 'text', '输入作词者姓名');
  });

  document.getElementById('edit-add-composer').addEventListener('click', function() {
    addArrayItem('edit-composers-container', 'composer', 'text', '输入作曲者姓名');
  });

  document.getElementById('edit-add-arranger').addEventListener('click', function() {
    addArrayItem('edit-arrangers-container', 'arranger', 'text', '输入编曲者姓名');
  });

  document.getElementById('edit-add-language').addEventListener('click', function() {
    addLanguageItem(false, 'edit-languages-container');
  });

  document.getElementById('edit-add-genre').addEventListener('click', function() {
    addArrayItem('edit-genres-container', 'genre', 'text', '输入风格名称');
  });

  document.getElementById('edit-add-alias').addEventListener('click', function() {
    const container = document.getElementById('edit-aliases-container');
    const itemDiv = document.createElement('div');
    itemDiv.className = 'array-item';
    
    const aliasDiv = document.createElement('div');
    aliasDiv.className = 'alias-fields';
    
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.name = 'alias-title';
    titleInput.placeholder = '别名';
    titleInput.className = 'form-input';
    
    const languageSelect = document.createElement('select');
    languageSelect.name = 'alias-language';
    languageSelect.className = 'form-select';
    
    const languages = ['', '中文', '英语', '日语', '韩语', '未知'];
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang || '选择语言';
      languageSelect.appendChild(option);
    });
    
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-array-item';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', function() {
      container.removeChild(itemDiv);
    });
    
    aliasDiv.appendChild(titleInput);
    aliasDiv.appendChild(languageSelect);
    itemDiv.appendChild(aliasDiv);
    itemDiv.appendChild(removeBtn);
    container.appendChild(itemDiv);
  });

  document.getElementById('edit-add-video').addEventListener('click', function() {
    addComplexArrayItem('edit-videos-container', 'video', [
      { type: 'url', name: 'video-url', placeholder: '视频URL', label: 'URL' },
      { type: 'text', name: 'video-title', placeholder: '视频标题', label: '标题' },
      { 
        type: 'select', 
        name: 'video-type', 
        label: '类型',
        options: [
          { value: '官方', text: '官方' },
          { value: '翻唱', text: '翻唱' },
          { value: '其他', text: '其他' }
        ]
      },
      { type: 'text', name: 'video-note', placeholder: '备注', label: '备注' }
    ]);
  });

  document.getElementById('edit-add-live').addEventListener('click', function() {
    addComplexArrayItem('edit-lives-container', 'live', [
      { type: 'url', name: 'live-url', placeholder: '直播回放URL', label: 'URL' },
      { type: 'text', name: 'live-title', placeholder: '直播标题', label: '标题' },
      { type: 'date', name: 'live-date', placeholder: '日期', label: '日期' },
      { type: 'text', name: 'live-note', placeholder: '备注', label: '备注' }
    ]);
  });

  document.getElementById('edit-add-clip').addEventListener('click', function() {
    addComplexArrayItem('edit-clips-container', 'clip', [
      { type: 'url', name: 'clip-url', placeholder: '切片视频URL', label: 'URL' },
      { type: 'text', name: 'clip-title', placeholder: '切片标题', label: '标题' },
      { type: 'date', name: 'clip-date', placeholder: '日期', label: '日期' },
      { type: 'text', name: 'clip-note', placeholder: '备注', label: '备注' }
    ]);
  });
}

// 初始化确认对话框
function initConfirmationDialog() {
  document.getElementById('confirmation-confirm-button').addEventListener('click', function() {
    const action = this.dataset.action;
    const data = this.dataset.data;
    
    if (action === 'clear-playlist') {
      clearPlaylist();
    } else if (action === 'close-form') {
      const formId = data;
      hideModal(formId);
      formModified = false;
    } else if (action === 'delete-song') {
      deleteSong(data);
    }
    
    hideModal('confirmation-modal');
  });
}

// 显示确认对话框
function showConfirmation(title, message, action, data = '') {
  document.getElementById('confirmation-title').textContent = title;
  document.getElementById('confirmation-message').textContent = message;
  document.getElementById('confirmation-confirm-button').dataset.action = action;
  document.getElementById('confirmation-confirm-button').dataset.data = data;
  showModal('confirmation-modal');
}

// 确认关闭表单
function confirmCloseForm(formId) {
  if (formModified) {
    showConfirmation('确认关闭', '表单内容已修改，确定要关闭吗？', 'close-form', formId);
  } else {
    hideModal(formId);
  }
}

// 确认清空歌单
function confirmClearPlaylist() {
  showConfirmation('确认清空', '您确定要清空整个歌单吗？此操作不可恢复！', 'clear-playlist');
}

// 确认删除歌曲
function confirmDeleteSong(songId) {
  showConfirmation('确认删除', '您确定要删除这首歌曲吗？此操作不可恢复！', 'delete-song', songId);
}

// 显示模态框
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add('active');
}

// 隐藏模态框
function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove('active');
}

// 显示添加歌曲模态框
function showAddSongModal() {
  showModal('add-song-modal');
  initForm();
}

// 显示高级搜索模态框
function showAdvancedSearchModal() {
  showModal('advanced-search-modal');
}

// 显示统计信息模态框
function showStatisticsModal() {
  showModal('statistics-modal');
  renderLanguageChart();
}

// 显示导出模态框
function showExportModal() {
  showModal('export-modal');
}

// 显示表格设置模态框
function showTableSettingsModal() {
  showModal('table-settings-modal');
}

// 执行搜索
function performSearch() {
  const searchText = document.getElementById('search-input').value.trim();
  
  if (searchText === '') {
    // 如果搜索文本为空，显示所有歌曲
    filteredData = [...playlistData];
  } else {
    // 按空格拆分关键词
    const keywords = searchText.split(/\s+/).filter(keyword => keyword.length > 0);
    
    // 搜索歌曲名和歌手
    filteredData = playlistData.filter(song => {
      const songTitle = song.primary.title.toLowerCase();
      const performers = song.performers.join(' ').toLowerCase();
      const aliases = song.aliases.map(alias => alias.title).join(' ').toLowerCase();
      
      // 检查是否包含所有关键词
      return keywords.every(keyword => {
        const lowerKeyword = keyword.toLowerCase();
        return songTitle.includes(lowerKeyword) || 
               performers.includes(lowerKeyword) || 
               aliases.includes(lowerKeyword);
      });
    });
  }
  
  // 按ID排序
  filteredData.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  
  // 应用当前过滤器
  applyFilters();
}

// 应用过滤器
function applyFilters() {
  let filteredResults = [...filteredData];
  
  // 应用语言过滤器
  if (currentFilters.language) {
    
    if(currentFilters.language == "未知"){
        filteredResults = filteredResults.filter(song => {
            return !song.languages ||  song.languages == '' || song.languages.length === 0 
            || song.languages.includes(currentFilters.language);
          });
    }else{
        filteredResults = filteredResults.filter(song => {
            return song.languages.includes(currentFilters.language);
          });
    }
  }
  
  // 应用风格过滤器
  if (currentFilters.genre) {
    if(currentFilters.genre == "未知"){
        filteredResults = filteredResults.filter(song => {
            return !song.genres ||  song.genres == '' || song.genres.length === 0 
            || song.genres.includes(currentFilters.genre);
          });
    }else{
        filteredResults = filteredResults.filter(song => {
            return song.genres.includes(currentFilters.genre);
          });
    }
  }
  
  // 应用当前排序
  applySort(filteredResults);
}

// 应用排序
function applySort(results) {
  const sortedResults = [...results];
  
  sortedResults.sort((a, b) => {
    let valueA, valueB;
    
    switch (currentSort.field) {
      case 'title':
        valueA = a.primary.title;
        valueB = b.primary.title;
        break;
      case 'artist':
        valueA = a.performers[0] || '';
        valueB = b.performers[0] || '';
        break;
      case 'language':
        valueA = a.languages[0] || '';
        valueB = b.languages[0] || '';
        break;
      case 'genre':
        valueA = a.genres[0] || '';
        valueB = b.genres[0] || '';
        break;
      case 'performance':
        valueA = a.lives ? a.lives.length : 0;
        valueB = b.lives ? b.lives.length : 0;
        break;
      case 'date':
        // 找到最近的演唱日期
        valueA = a.lives && a.lives.length > 0 ? 
          getLatestValidDate(a.lives) : '';
        valueB = b.lives && b.lives.length > 0 ? 
          getLatestValidDate(b.lives) : '';
        break;
      default:
        valueA = a.id;
        valueB = b.id;
    }
    
    // 处理空值
    if (!valueA) valueA = '';
    if (!valueB) valueB = '';
    
    // 比较值 - 如果是日期，转换为时间戳比较
    if (currentSort.field === 'date') {
      const timeA = valueA ? new Date(valueA).getTime() : 0;
      const timeB = valueB ? new Date(valueB).getTime() : 0;
      
      if (timeA < timeB) {
        return currentSort.direction === 'asc' ? -1 : 1;
      }
      if (timeA > timeB) {
        return currentSort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    } else {
      // 其他字段的比较逻辑保持不变
      if (valueA < valueB) {
        return currentSort.direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return currentSort.direction === 'asc' ? 1 : -1;
      }
      return 0;
    }
  });
  
  // 渲染结果
  renderPlaylistTable(sortedResults);
}

// 辅助函数：获取有效的最近日期
function getLatestValidDate(lives) {
  const validLives = lives.filter(live => live && live.date && !isNaN(new Date(live.date).getTime()));
  if (validLives.length === 0) return '';
  
  return validLives.reduce((latest, current) => {
    return new Date(current.date) > new Date(latest.date) ? current : latest;
  }, validLives[0]).date;
}

// 切换排序
function toggleSort(field) {
  if (currentSort.field === field) {
    // 如果已经是当前字段，切换方向
    currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
  } else {
    // 如果是新字段，设置为升序
    currentSort.field = field;
    currentSort.direction = 'asc';
  }
  
  // 更新排序图标
  updateSortIcons();
  
  // 应用排序
  applySort(filteredData.length > 0 ? filteredData : playlistData);
}

// 更新排序图标
function updateSortIcons() {
  const sortableHeaders = document.querySelectorAll('.sortable-column');
  
  sortableHeaders.forEach(header => {
    const icon = header.querySelector('.sort-icon');
    const field = header.dataset.sort;
    
    if (field === currentSort.field) {
      if (currentSort.direction === 'asc') {
        icon.className = 'fas fa-sort-asc sort-icon';
      } else {
        icon.className = 'fas fa-sort-desc sort-icon';
      }
    } else {
      icon.className = 'fas fa-sort sort-icon';
    }
  });
}

// 执行高级搜索
function performAdvancedSearch() {
  // 获取搜索条件
  const title = document.getElementById('as-title').value.trim();
  const artist = document.getElementById('as-artist').value.trim();
  const lyricist = document.getElementById('as-lyricist').value.trim();
  const composer = document.getElementById('as-composer').value.trim();
  const arranger = document.getElementById('as-arranger').value.trim();
  const language = document.getElementById('as-language').value;
  const genre = document.getElementById('as-genre').value;
  const dateFrom = document.getElementById('as-date-from').value;
  const dateTo = document.getElementById('as-date-to').value;
  const performanceMin = parseInt(document.getElementById('as-performance-min').value) || 0;
  const performanceMax = parseInt(document.getElementById('as-performance-max').value) || Infinity;
  
  // 执行搜索
  filteredData = playlistData.filter(song => {
    // 歌名匹配
    if (title && !song.primary.title.toLowerCase().includes(title.toLowerCase())) {
      return false;
    }
    
    // 歌手匹配
    if (artist && !song.performers.some(performer => 
      performer.toLowerCase().includes(artist.toLowerCase()))) {
      return false;
    }
    
    // 作词者匹配
    if (lyricist && !song.lyricists.some(item => 
      item.toLowerCase().includes(lyricist.toLowerCase()))) {
      return false;
    }
    
    // 作曲者匹配
    if (composer && !song.composers.some(item => 
      item.toLowerCase().includes(composer.toLowerCase()))) {
      return false;
    }
    
    // 编曲者匹配
    if (arranger && !song.arrangers.some(item => 
      item.toLowerCase().includes(arranger.toLowerCase()))) {
      return false;
    }
    
    // 语言匹配
    if (language && !song.languages.includes(language)) {
      return false;
    }
    
    // 风格匹配
    if (genre && !song.genres.includes(genre)) {
      return false;
    }
    
    // 演唱次数范围
    const performanceCount = song.lives ? song.lives.length : 0;
    if (performanceCount < performanceMin || performanceCount > performanceMax) {
      return false;
    }
    
    // 日期范围
    if (dateFrom || dateTo) {
      if (!song.lives || song.lives.length === 0) {
        return false;
      }
      
      // 找到最近的演唱日期
      const latestLive = song.lives.reduce((latest, current) => {
        return current.date > latest.date ? current : latest;
      }, song.lives[0]);
      
      if (dateFrom && latestLive.date < dateFrom) {
        return false;
      }
      
      if (dateTo && latestLive.date > dateTo) {
        return false;
      }
    }
    
    return true;
  });
  
  // 应用当前排序
  applySort(filteredData);
  
  // 关闭模态框
  hideModal('advanced-search-modal');
}

// 渲染语言统计图表
function renderLanguageChart() {
  const ctx = document.getElementById('language-chart').getContext('2d');
  
  // 统计各语言的歌曲数量
  const languageCounts = {};
  playlistData.forEach(song => {
    song.languages.forEach(language => {
      languageCounts[language] = (languageCounts[language] || 0) + 1;
    });
  });
  
  // 准备图表数据
  const languages = Object.keys(languageCounts);
  const counts = Object.values(languageCounts);
  
  // 生成颜色
  const backgroundColors = [
    '#7c3aed', '#a78bfa', '#f43f5e', '#fda4af', '#10b981',
    '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'
  ];
  
  // 创建图表
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: languages,
      datasets: [{
        data: counts,
        backgroundColor: backgroundColors.slice(0, languages.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || '';
              const value = context.raw || 0;
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

// 导出歌单
function exportPlaylist(format) {
  if (format === 'csv') {
    exportToCSV();
  } else if (format === 'json') {
    exportToJSON();
  }
  
  hideModal('export-modal');
}

// 导出为CSV
function exportToCSV() {
  const dataToExport = filteredData.length > 0 ? filteredData : playlistData;
  
  // CSV标题行
  let csv = '歌名,歌手,语言,风格,演唱次数,最近演唱\n';
  
  // 添加数据行
  dataToExport.forEach(song => {
    const title = song.primary.title;
    const artists = song.performers.join(';');
    const languages = song.languages.join(';');
    const genres = song.genres.join(';');
    const performanceCount = song.lives ? song.lives.length : 0;
    
    // 找到最近的演唱日期
    let latestDate = '';
    if (song.lives && song.lives.length > 0) {
      const latestLive = song.lives.reduce((latest, current) => {
        return current.date > latest.date ? current : latest;
      }, song.lives[0]);
      latestDate = latestLive.date;
    }
    
    // 转义特殊字符
    const escape = (value) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    
    csv += `${escape(title)},${escape(artists)},${escape(languages)},${escape(genres)},${performanceCount},${latestDate}\n`;
  });
  
  // 创建下载链接
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', '花玲歌单.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 导出为JSON
function exportToJSON() {
  const dataStr = JSON.stringify(playlistData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', '花玲歌单.json');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 清空歌单
function clearPlaylist() {
  playlistData = [];
  filteredData = [];
  renderPlaylist();
  updateStats();
}

// 保存表格设置
function saveTableSettings() {
  // 这里可以保存表格设置到localStorage或直接应用
  // 例如：显示/隐藏列
  hideModal('table-settings-modal');
}

// 渲染歌单表格
function renderPlaylist() {
  const dataToRender = filteredData.length > 0 ? filteredData : playlistData;
  applySort(dataToRender);
}

// 渲染歌单表格（实际实现）
function renderPlaylistTable(data) {
  const tbody = document.getElementById('playlist-body');
  tbody.innerHTML = '';
  
  data.forEach((song, index) => {
    const tr = document.createElement('tr');
    
    // 添加双击编辑事件
    tr.addEventListener('dblclick', function() {
      editSong(song.id);
    });

    // 序号
    const numTd = document.createElement('td');
    numTd.textContent = index+1;
    numTd.className = 'col-index';
    tr.appendChild(numTd);
    
    // 歌名
    const titleTd = document.createElement('td');
    titleTd.className = 'col-title';
    titleTd.textContent = song.primary.title;
    tr.appendChild(titleTd);
    
    // 歌手
    const performersTd = document.createElement('td');
    performersTd.className = 'col-performer';
    performersTd.textContent = song.performers.join(', ');
    tr.appendChild(performersTd);
    
    // 语言
    const languagesTd = document.createElement('td');
    languagesTd.className = 'col-language';
    languagesTd.textContent = song.languages.join(', ');
    tr.appendChild(languagesTd);
    
    // 风格
    const genresTd = document.createElement('td');
    genresTd.className = 'col-genre';
    genresTd.textContent = song.genres.join(', ') || '';
    tr.appendChild(genresTd);
    
    // 演唱次数
    const performanceTd = document.createElement('td');
    performanceTd.className = 'col-count';
    const performanceCount = song.lives ? song.lives.length : 0;
    performanceTd.textContent = performanceCount;
    tr.appendChild(performanceTd);
    
    // 最近演唱日期
    const dateTd = document.createElement('td');
    dateTd.className = 'col-date';
    // 检查是否有有效的直播记录
    if (Array.isArray(song.lives) && song.lives.length > 0) {
        // 筛选出有URL的有效直播记录
        const validLives = song.lives.filter(live => 
        live && live.url && live.url.trim() !== '');
    
        if (validLives.length > 0) {
        // 找到最近的日期（优先处理有日期的记录）
        const latestLive = validLives.reduce((latest, current) => {
            // 处理无日期的情况（视为较早的记录）
            if (!current.date || current.date.trim() === '') return latest;
            if (!latest.date || latest.date.trim() === '') return current;
            
            // 比较日期（YYYY-MM-DD格式可直接字符串比较）
            return current.date > latest.date ? current : latest;
        }, validLives[0]);
    
        // 创建超链接元素
        const link = document.createElement('a');
        link.href = latestLive.url;
        link.target = '_blank'; // 新窗口打开
        link.rel = 'noopener noreferrer'; // 安全设置
    
        // 设置链接显示文本（处理空日期）
        const displayText = latestLive.date && latestLive.date.trim() 
            ? formatDate(latestLive.date) 
            : '查看录播'; // 日期为空时的默认文本
    
        link.textContent = displayText;
        
        // 添加到单元格
        dateTd.appendChild(link);
        } else {
            // 有直播记录但无有效URL
            dateTd.textContent = '无录播链接';
            dateTd.classList.add('text-muted');
        }
    } else {
        // 无直播记录
        dateTd.textContent = '无歌回记录';
        dateTd.classList.add('text-muted');
    }
    tr.appendChild(dateTd);
    
    // 操作列
    const actionTd = document.createElement('td');
    actionTd.className = 'col-actions';
    actionTd.innerHTML = '<i class="fas fa-ellipsis-v"></i>';
    actionTd.style.textAlign = 'center';
    
    // 添加点击编辑事件
    actionTd.addEventListener('click', function() {
      editSong(song.id);
    });
    
    tr.appendChild(actionTd);
    
    tbody.appendChild(tr);
  });
}

// 更新歌曲
function updateSong() {
  // 获取表单数据并更新歌曲
  // 这里省略具体实现，与添加歌曲类似
  
  // 更新UI
  renderPlaylist();
  updateStats();
  
  // 关闭模态框
  hideModal('edit-song-modal');
  formModified = false;
}

// 删除歌曲
function deleteSong(songId) {
  playlistData = playlistData.filter(song => song.id !== songId);
  filteredData = filteredData.filter(song => song.id !== songId);
  
  // 更新UI
  renderPlaylist();
  updateStats();
  
  // 关闭模态框
  hideModal('edit-song-modal');
}

// 更新统计信息
function updateStats() {
  // 歌曲数量
  document.getElementById('song-count').textContent = `${playlistData.length} 首歌曲`;
  
  // 歌手数量（去重）
  const allPerformers = new Set();
  playlistData.forEach(song => {
    song.performers.forEach(performer => {
      allPerformers.add(performer);
    });
  });
  
  document.getElementById('artist-count').textContent = `${allPerformers.size} 位歌手`;
}

// 格式化日期显示
function formatDate(dateString) {
  if (!dateString) return '未知日期';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) { // 检查日期是否有效
    return '无效日期';
  }
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// 初始化表单
function initForm() {
  // 清空表单
  document.getElementById('song-form').reset();
  
  // 清空动态字段
  clearDynamicFields();
  
  // 默认添加一个演唱者输入框（必填）
  addArrayItem('performers-container', 'performer', 'text', '输入演唱者姓名', true);
  
  // 默认添加主要语言
  addLanguageItem(true);
  
  // 重置表单修改状态
  formModified = false;
}

// 清空动态字段
function clearDynamicFields() {
  const containers = [
    'performers-container',
    'lyricists-container',
    'composers-container',
    'arrangers-container',
    'languages-container',
    'genres-container',
    'aliases-container',
    'videos-container',
    'lives-container',
    'clips-container',
    // 新增编辑表单容器
    'edit-performers-container',
    'edit-lyricists-container',
    'edit-composers-container',
    'edit-arrangers-container',
    'edit-languages-container',
    'edit-genres-container',
    'edit-aliases-container',
    'edit-videos-container',
    'edit-lives-container',
    'edit-clips-container'
  ];
  
  containers.forEach(containerId => {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
  });
}

// 添加新歌曲
function addNewSong() {
  // 获取表单数据
  const title = document.getElementById('song-title').value;
  const language = document.getElementById('song-language').value;
  const note = document.getElementById('song-note').value;
  
  // 获取演唱者
  const performers = [];
  document.querySelectorAll('#performers-container input[name="performer"]').forEach(input => {
    if (input.value.trim()) {
      performers.push(input.value.trim());
    }
  });
  
  // 获取作词者
  const lyricists = [];
  document.querySelectorAll('#lyricists-container input[name="lyricist"]').forEach(input => {
    if (input.value.trim()) {
      lyricists.push(input.value.trim());
    }
  });
  
  // 获取作曲者
  const composers = [];
  document.querySelectorAll('#composers-container input[name="composer"]').forEach(input => {
    if (input.value.trim()) {
      composers.push(input.value.trim());
    }
  });
  
  // 获取编曲者
  const arrangers = [];
  document.querySelectorAll('#arrangers-container input[name="arranger"]').forEach(input => {
    if (input.value.trim()) {
      arrangers.push(input.value.trim());
    }
  });
  
  // 获取别名
  const aliases = [];
  document.querySelectorAll('#aliases-container .array-item').forEach(item => {
    const titleInput = item.querySelector('input[name="alias-title"]');
    const languageSelect = item.querySelector('select[name="alias-language"]');
    if (titleInput.value.trim()) {
      aliases.push({
        title: titleInput.value.trim(),
        language: languageSelect.value
      });
    }
  });
  
  // 获取其他语言
  const languages = [language];
  document.querySelectorAll('#languages-container select[name="language"]').forEach(select => {
    if (select.value && !languages.includes(select.value)) {
      languages.push(select.value);
    }
  });
  
  // 获取风格
  const genres = [];
  document.querySelectorAll('#genres-container input[name="genre"]').forEach(input => {
    if (input.value.trim()) {
      genres.push(input.value.trim());
    }
  });
  
  // 获取视频
  const videos = [];
  document.querySelectorAll('#videos-container .array-item').forEach(item => {
    const urlInput = item.querySelector('input[name="videos-container-url"]');
    const titleInput = item.querySelector('input[name="videos-container-title"]');
    const typeSelect = item.querySelector('select[name="videos-container-type"]');
    const noteInput = item.querySelector('input[name="videos-container-note"]');
    
    videos.push({
      url: urlInput.value,
      title: titleInput.value,
      type: typeSelect.value,
      note: noteInput.value
    });
  });
  
  // 获取直播回放
  const lives = [];
  document.querySelectorAll('#lives-container .array-item').forEach(item => {
    const urlInput = item.querySelector('input[name="lives-container-url"]');
    const titleInput = item.querySelector('input[name="lives-container-title"]');
    const dateInput = item.querySelector('input[name="lives-container-date"]');
    const noteInput = item.querySelector('input[name="lives-container-note"]');
    
    lives.push({
      url: urlInput.value,
      title: titleInput.value,
      date: dateInput.value,
      note: noteInput.value
    });
  });
  
  // 获取切片视频
  const clips = [];
  document.querySelectorAll('#clips-container .array-item').forEach(item => {
    const urlInput = item.querySelector('input[name="clips-container-url"]');
    const titleInput = item.querySelector('input[name="clips-container-title"]');
    const dateInput = item.querySelector('input[name="clips-container-date"]');
    const noteInput = item.querySelector('input[name="clips-container-note"]');
    
    clips.push({
      url: urlInput.value,
      title: titleInput.value,
      date: dateInput.value,
      note: noteInput.value
    });
  });
  
  // 创建新歌曲对象
  const newSong = {
    id: generateUniqueId(), // 使用专用函数生成唯一ID
    primary: {
      title: title,
      language: language
    },
    aliases: aliases,
    performers: performers,
    lyricists: lyricists,
    composers: composers,
    arrangers: arrangers,
    languages: languages,
    genres: genres,
    videos: videos,
    lives: lives,
    clips: clips,
    note: note
  };
  
  // 添加到数据数组
  playlistData.push(newSong);
  
  // 更新UI
  renderPlaylist();
  updateStats();
  
  // 关闭模态框
  hideModal('add-song-modal');
  formModified = false;
}

// 添加生成唯一ID的函数
function generateUniqueId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10); // 增加随机字符长度
  return `${timestamp}-${random}`;
}

// 确认删除歌曲
function confirmDeleteSong(songId) {
  showConfirmation('确认删除', '您确定要删除这首歌曲吗？', 'delete-song', songId);
}

// 执行删除
function deleteSong(songId) {
  playlistData = playlistData.filter(song => song.id !== songId);
  renderPlaylist();
  updateStats();
}

// 添加数组项（通用函数）
function addArrayItem(containerId, name, type, placeholder, required = false) {
  const container = document.getElementById(containerId);
  const itemDiv = document.createElement('div');
  itemDiv.className = 'array-item';
  
  const inputDiv = document.createElement('div');
  inputDiv.className = 'input-with-clear';
  
  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.placeholder = placeholder;
  input.className = 'form-input';
  if (required) input.required = true;
  
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'clear-button';
  clearBtn.innerHTML = '&times;';
  clearBtn.addEventListener('click', function() {
    input.value = '';
    this.style.display = 'none';
  });
  
  input.addEventListener('input', function() {
    clearBtn.style.display = this.value ? 'block' : 'none';
  });
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-array-item';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', function() {
    container.removeChild(itemDiv);
  });
  
  inputDiv.appendChild(input);
  inputDiv.appendChild(clearBtn);
  itemDiv.appendChild(inputDiv);
  itemDiv.appendChild(removeBtn);
  container.appendChild(itemDiv);
}

// 添加语言项
function addLanguageItem(isPrimary = false, containerId = 'languages-container') {
  const container = document.getElementById(containerId);
  const itemDiv = document.createElement('div');
  itemDiv.className = 'array-item';
  
  const select = document.createElement('select');
  select.name = 'language';
  select.className = 'form-select';
  
  // 添加语言选项
  const languages = ['', '中文', '英语', '日语', '韩语', '未知'];
  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = lang || '选择语言';
    select.appendChild(option);
  });
  
  // 如果是主要语言，设置为表单中选择的主要语言
  if (isPrimary) {
    const primaryLanguage = document.getElementById('song-language').value;
    if (primaryLanguage) {
      select.value = primaryLanguage;
    }
  }
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-array-item';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', function() {
    container.removeChild(itemDiv);
  });
  
  itemDiv.appendChild(select);
  itemDiv.appendChild(removeBtn);
  container.appendChild(itemDiv);
}

// 添加复杂数组项（用于视频、直播回放、切片视频等）
function addComplexArrayItem(containerId, prefix, fields) {
  const container = document.getElementById(containerId);
  const itemDiv = document.createElement('div');
  itemDiv.className = 'array-item';
  
  const fieldsDiv = document.createElement('div');
  fieldsDiv.className = 'array-item-fields';
  
  fields.forEach(field => {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'array-item-field';
    
    const label = document.createElement('label');
    label.textContent = field.label;
    
    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      input.className = 'form-select';
      input.name = field.name;
      field.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        input.appendChild(option);
      });
    } else {
      input = document.createElement('input');
      input.type = field.type;
      input.className = 'form-input';
      input.placeholder = field.placeholder;
      input.name = field.name;
    }
    
    fieldDiv.appendChild(label);
    fieldDiv.appendChild(input);
    fieldsDiv.appendChild(fieldDiv);
  });
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-array-item';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', function() {
    container.removeChild(itemDiv);
  });
  
  itemDiv.appendChild(fieldsDiv);
  itemDiv.appendChild(removeBtn);
  container.appendChild(itemDiv);
}

// 编辑歌曲
function editSong(songId) {
  const song = playlistData.find(s => s.id === songId);
  if (!song) return;
  
  // 填充表单数据
  const form = document.getElementById('edit-song-form');
  form.dataset.songId = songId;
  
  // 基本信息
  document.getElementById('edit-song-title').value = song.primary.title;
  document.getElementById('edit-song-language').value = song.primary.language;
  document.getElementById('edit-song-note').value = song.note || '';
  
  // 清空动态字段容器
  clearDynamicFields();
  
  // 演唱者
  song.performers.forEach(performer => {
    addArrayItemWithValue('edit-performers-container', 'performer', 'text', '输入演唱者姓名', performer, true);
  });
  
  // 作词者
  song.lyricists.forEach(lyricist => {
    addArrayItemWithValue('edit-lyricists-container', 'lyricist', 'text', '输入作词者姓名', lyricist);
  });
  
  // 作曲者
  song.composers.forEach(composer => {
    addArrayItemWithValue('edit-composers-container', 'composer', 'text', '输入作曲者姓名', composer);
  });
  
  // 编曲者
  song.arrangers.forEach(arranger => {
    addArrayItemWithValue('edit-arrangers-container', 'arranger', 'text', '输入编曲者姓名', arranger);
  });
  
  // 语言
  song.languages.forEach((language, index) => {
    if (index === 0) {
      document.getElementById('edit-song-language').value = language;
    } else {
      addLanguageItemWithValue('edit-languages-container', language);
    }
  });
  
  // 风格
  song.genres.forEach(genre => {
    addArrayItemWithValue('edit-genres-container', 'genre', 'text', '输入风格名称', genre);
  });
  
  // 别名
  song.aliases.forEach(alias => {
    addAliasItemWithValue('edit-aliases-container', alias.title, alias.language);
  });
  
  // 视频
  song.videos.forEach(video => {
    addComplexArrayItemWithValue('edit-videos-container', 'video', [
      { type: 'url', name: 'video-url', placeholder: '视频URL', label: 'URL', value: video.url },
      { type: 'text', name: 'video-title', placeholder: '视频标题', label: '标题', value: video.title },
      { 
        type: 'select', 
        name: 'video-type', 
        label: '类型',
        value: video.type,
        options: [
          { value: '官方', text: '官方' },
          { value: '翻唱', text: '翻唱' },
          { value: '其他', text: '其他' }
        ]
      },
      { type: 'text', name: 'video-note', placeholder: '备注', label: '备注', value: video.note }
    ]);
  });
  
  // 直播回放
  song.lives.forEach(live => {
    addComplexArrayItemWithValue('edit-lives-container', 'live', [
      { type: 'url', name: 'live-url', placeholder: '直播回放URL', label: 'URL', value: live.url },
      { type: 'text', name: 'live-title', placeholder: '直播标题', label: '标题', value: live.title },
      { type: 'date', name: 'live-date', placeholder: '日期', label: '日期', value: live.date },
      { type: 'text', name: 'live-note', placeholder: '备注', label: '备注', value: live.note }
    ]);
  });
  
  // 切片视频
  song.clips.forEach(clip => {
    addComplexArrayItemWithValue('edit-clips-container', 'clip', [
      { type: 'url', name: 'clip-url', placeholder: '切片视频URL', label: 'URL', value: clip.url },
      { type: 'text', name: 'clip-title', placeholder: '切片标题', label: '标题', value: clip.title },
      { type: 'date', name: 'clip-date', placeholder: '日期', label: '日期', value: clip.date },
      { type: 'text', name: 'clip-note', placeholder: '备注', label: '备注', value: clip.note }
    ]);
  });
  
  // 显示编辑模态框
  showModal('edit-song-modal');
}

// 带值的数组项添加函数
function addArrayItemWithValue(containerId, name, type, placeholder, value, required = false) {
  const container = document.getElementById(containerId);
  const itemDiv = document.createElement('div');
  itemDiv.className = 'array-item';
  
  const inputDiv = document.createElement('div');
  inputDiv.className = 'input-with-clear';
  
  const input = document.createElement('input');
  input.type = type;
  input.name = name;
  input.placeholder = placeholder;
  input.className = 'form-input';
  input.value = value || '';
  if (required) input.required = true;
  
  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'clear-button';
  clearBtn.innerHTML = '&times;';
  clearBtn.style.display = input.value ? 'block' : 'none';
  clearBtn.addEventListener('click', function() {
    input.value = '';
    this.style.display = 'none';
  });
  
  input.addEventListener('input', function() {
    clearBtn.style.display = this.value ? 'block' : 'none';
  });
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-array-item';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', function() {
    container.removeChild(itemDiv);
  });
  
  inputDiv.appendChild(input);
  inputDiv.appendChild(clearBtn);
  itemDiv.appendChild(inputDiv);
  itemDiv.appendChild(removeBtn);
  container.appendChild(itemDiv);
}

// 带值的语言项添加函数
function addLanguageItemWithValue(containerId, value) {
  const container = document.getElementById(containerId);
  const itemDiv = document.createElement('div');
  itemDiv.className = 'array-item';
  
  const select = document.createElement('select');
  select.name = 'language';
  select.className = 'form-select';
  
  // 添加语言选项
  const languages = ['', '中文', '英语', '日语', '韩语', '未知'];
  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = lang || '选择语言';
    if (lang === value) option.selected = true;
    select.appendChild(option);
  });
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-array-item';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', function() {
    container.removeChild(itemDiv);
  });
  
  itemDiv.appendChild(select);
  itemDiv.appendChild(removeBtn);
  container.appendChild(itemDiv);
}

// 带值的别名项添加函数
function addAliasItemWithValue(containerId, title, language) {
  const container = document.getElementById(containerId);
  const itemDiv = document.createElement('div');
  itemDiv.className = 'array-item';
  
  const aliasDiv = document.createElement('div');
  aliasDiv.className = 'alias-fields';
  
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.name = 'alias-title';
  titleInput.placeholder = '别名';
  titleInput.className = 'form-input';
  titleInput.value = title || '';
  
  const languageSelect = document.createElement('select');
  languageSelect.name = 'alias-language';
  languageSelect.className = 'form-select';
  
  const languages = ['', '中文', '英语', '日语', '韩语', '未知'];
  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang;
    option.textContent = lang || '选择语言';
    if (lang === language) option.selected = true;
    languageSelect.appendChild(option);
  });
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-array-item';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', function() {
    container.removeChild(itemDiv);
  });
  
  aliasDiv.appendChild(titleInput);
  aliasDiv.appendChild(languageSelect);
  itemDiv.appendChild(aliasDiv);
  itemDiv.appendChild(removeBtn);
  container.appendChild(itemDiv);
}

// 带值的复杂数组项添加函数
function addComplexArrayItemWithValue(containerId, prefix, fields) {
  const container = document.getElementById(containerId);
  const itemDiv = document.createElement('div');
  itemDiv.className = 'array-item';
  
  const fieldsDiv = document.createElement('div');
  fieldsDiv.className = 'array-item-fields';
  
  fields.forEach(field => {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'array-item-field';
    
    const label = document.createElement('label');
    label.textContent = field.label;
    
    let input;
    if (field.type === 'select') {
      input = document.createElement('select');
      input.className = 'form-select';
      input.name = field.name;
      field.options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        if (opt.value === field.value) option.selected = true;
        input.appendChild(option);
      });
    } else {
      input = document.createElement('input');
      input.type = field.type;
      input.className = 'form-input';
      input.placeholder = field.placeholder;
      input.name = field.name;
      input.value = field.value || '';
    }
    
    fieldDiv.appendChild(label);
    fieldDiv.appendChild(input);
    fieldsDiv.appendChild(fieldDiv);
  });
  
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-array-item';
  removeBtn.innerHTML = '&times;';
  removeBtn.addEventListener('click', function() {
    container.removeChild(itemDiv);
  });
  
  itemDiv.appendChild(fieldsDiv);
  itemDiv.appendChild(removeBtn);
  container.appendChild(itemDiv);
}

// 从CSV导入
function importFromCSV(csvContent) {
  // 简单的CSV解析实现
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const newData = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim());
    const song = {
      id: generateUniqueId(),
      primary: {
        title: values[headers.indexOf('歌名')] || '',
        language: values[headers.indexOf('语言')] || ''
      },
      performers: values[headers.indexOf('歌手')] ? values[headers.indexOf('歌手')].split(';') : [],
      languages: values[headers.indexOf('语言')] ? values[headers.indexOf('语言')].split(';') : [],
      genres: values[headers.indexOf('风格')] ? values[headers.indexOf('风格')].split(';') : [],
      lives: [],
      note: ''
    };
    
    newData.push(song);
  }
  
  playlistData = [...playlistData, ...newData];
  filteredData = [...playlistData];
  renderPlaylist();
  updateStats();
  hideModal('import-modal');
  alert(`成功导入 ${newData.length} 首歌曲`);
}

// 从JSON导入
function importFromJSON(jsonContent) {
  try {
    const data = JSON.parse(jsonContent);
    if (Array.isArray(data)) {
      // 为新导入的歌曲分配ID
      const newData = data.map((song, index) => {
        return {
          ...song,
          id: generateUniqueId()
        };
      });
      
      playlistData = [...playlistData, ...newData];
      filteredData = [...playlistData];
      renderPlaylist();
      updateStats();
      hideModal('import-modal');
      alert(`成功导入 ${newData.length} 首歌曲`);
    } else {
      alert('无效的歌单数据格式');
    }
  } catch (error) {
    alert('解析JSON失败：' + error.message);
  }
}

// 文件拖放功能
const fileDropArea = document.getElementById('file-drop-area');
const fileInput = document.getElementById('file-input');

if (fileDropArea && fileInput) {
  fileDropArea.addEventListener('click', () => {
    fileInput.click();
  });
  
  fileDropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropArea.classList.add('dragover');
  });
  
  fileDropArea.addEventListener('dragleave', () => {
    fileDropArea.classList.remove('dragover');
  });
  
  fileDropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
      fileInput.files = e.dataTransfer.files;
      updateFileInfo(e.dataTransfer.files[0]);
    }
  });
  
  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
      updateFileInfo(fileInput.files[0]);
    }
  });
}

// 更新文件信息
function updateFileInfo(file) {
  const fileName = document.getElementById('file-name');
  const fileSize = document.getElementById('file-size');
  const fileStatus = document.getElementById('file-status');
  
  if (fileName) fileName.textContent = file.name;
  if (fileSize) fileSize.textContent = formatFileSize(file.size);
  if (fileStatus) fileStatus.textContent = '文件已选择';
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 初始化浮动按钮功能
function initFloatingButtons() {
  // 主题切换功能
  const themeToggle = document.getElementById('theme-toggle');
  const themes = ['theme-hualing', 'theme-baiye', 'theme-huotian', 'theme-xingye'];
  let currentThemeIndex = 0;
  
  themeToggle.addEventListener('click', function() {
    // 移除当前主题
    document.body.classList.remove(themes[currentThemeIndex]);
    
    // 切换到下一个主题
    currentThemeIndex = (currentThemeIndex + 1) % themes.length;
    
    // 应用新主题
    document.body.classList.add(themes[currentThemeIndex]);
    
    // 显示主题名称提示
    const themeNames = ['花玲', '白叶', '霍天', '星夜'];
    showToast(`已切换到${themeNames[currentThemeIndex]}主题`);
  });
  
  // 提示按钮功能
  const tipsButton = document.getElementById('tips-button');
  const tipsModal = document.getElementById('tips-modal');
  const tipsCloseButton = document.getElementById('tips-close-button');
  const tipsCloseBtn = document.getElementById('tips-close-btn');
  
  tipsButton.addEventListener('click', function() {
    showModal('tips-modal');
  });
  
  tipsCloseButton.addEventListener('click', function() {
    hideModal('tips-modal');
  });
  
  tipsCloseBtn.addEventListener('click', function() {
    hideModal('tips-modal');
  });
  
  // 回到顶部按钮功能
  const backToTopButton = document.getElementById('back-to-top');
  
  backToTopButton.addEventListener('click', function() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
  
  // 监听滚动事件，显示/隐藏回到顶部按钮
  window.addEventListener('scroll', function() {
    if (window.scrollY > 300) {
      backToTopButton.style.display = 'flex';
    } else {
      backToTopButton.style.display = 'none';
    }
  });
}

// 显示Toast提示
function showToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    background: var(--primary-color);
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10000;
    box-shadow: var(--shadow);
    transition: opacity 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 2000);
}

