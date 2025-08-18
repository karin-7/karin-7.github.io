document.addEventListener('DOMContentLoaded', () => {
  // 常量和DOM元素
  const elements = {
    form: document.getElementById('search-form'),
    search: document.getElementById('search-input'),
    button: document.getElementById('search-button'),
    language: document.getElementById('language-filter'),
    genre: document.getElementById('genre-filter'),
    table: document.querySelector('#playlist-table tbody'),
    songCount: document.getElementById('song-count'),
    artistCount: document.getElementById('artist-count')
  };

  const templates = {
    error: message => `
      <tr><td colspan="4" class="message-cell">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>${message}</h3>
        <p>请检查数据文件路径或格式</p>
      </td></tr>`,
    empty: () => `
      <tr><td colspan="4" class="message-cell">
        <i class="fas fa-music"></i>
        <h3>没有找到匹配的歌曲</h3>
        <p>尝试修改搜索或筛选条件</p>
      </td></tr>`,
    row: song => `
      <td>
        <div class="song-title">
          <!-- <i class="fas fa-play-circle"></i> -->
          <div>${song.title}</div>
        </div>
      </td>
      <td>${song.artist}</td> 
      <td><span class="language-tag ${getLanguageClass(song.language)}">${song.language}</span></td>
      <td>${song.genre}</td>
      <td><a href="${song.audio}">${song.bv}</a></td>
      `
  };


  let state = {
    songs: [],
    artists: new Set(),  // 使用 Set 去重
    sortField: null,     // 当前排序字段
    sortDirection: null  // 排序方向: 'asc' 或 'desc'
  };

  // 工具函数
  const getLanguageClass = language => {
    const langMap = { "中文": "chinese", "英语": "english", "日语": "japanese", "韩语": "korean" };
    return langMap[language] || '';
  };

  const updateStatistics = () => {
    state.artists.clear();
    state.songs.forEach(song => state.artists.add(song.artist));
    elements.songCount.textContent = `${state.songs.length} 首歌曲`;
    elements.artistCount.textContent = `${state.artists.size} 位歌手`;
  };

  // 排序函数
  const sortSongs = (songs) => {
    if (!state.sortField) return songs;
    
    return [...songs].sort((a, b) => {
      const fieldA = a[state.sortField] || '';
      const fieldB = b[state.sortField] || '';
      
      // 特殊处理空值
      if (fieldA === '' && fieldB !== '') return 1;
      if (fieldB === '' && fieldA !== '') return -1;
      
      // 使用localeCompare进行正确的中文排序
      const comparison = fieldA.localeCompare(fieldB, 'zh');
      
      return state.sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // 更新表头排序状态
  const updateHeaderSortIcons = () => {
    document.querySelectorAll('th').forEach(header => {
      const icon = header.querySelector('.sort-icon');
      const field = header.getAttribute('data-sort');
      
      icon.classList.remove('active', 'asc', 'desc');
      
      if (field === state.sortField) {
        icon.classList.add('active', state.sortDirection);
      }
    });
  };

  // 处理排序点击事件
  const handleSort = (sortField) => {
    // 如果点击的是当前排序字段，则切换方向
    if (state.sortField === sortField) {
      state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } 
    // 否则设置为新字段并默认升序
    else {
      state.sortField = sortField;
      state.sortDirection = 'asc';
    }
    
    updateHeaderSortIcons();
    filterSongs();
  };

  // 渲染函数
  const renderTable = songs => {
    elements.table.innerHTML = songs.length ? 
      songs.map(song => `<tr>${templates.row(song)}</tr>`).join('') : 
      templates.empty();
  };

  // 过滤函数
  const filterSongs = () => {
    const filters = {
      search: elements.search.value.toLowerCase(),
      language: elements.language.value,
      genre: elements.genre.value
    };

    filtered = state.songs.filter(song => 
      (!filters.search || 
        song.title.toLowerCase().includes(filters.search) || 
        song.artist.toLowerCase().includes(filters.search)) &&
      (!filters.language || song.language === filters.language) &&
      (!filters.genre || song.genre === filters.genre)
    );

    filtered = sortSongs(filtered);

    renderTable(filtered);
  };

  // 初始化
  const init = async () => {
    try {
      const response = await fetch('playlist.json');
      state.songs = await response.json();
      renderTable(state.songs);
      updateStatistics();

      // 事件监听
      elements.form.addEventListener('submit', e => {
        e.preventDefault();
        filterSongs();
      });
      elements.button.addEventListener('click', filterSongs);
      elements.language.addEventListener('change', filterSongs);
      elements.genre.addEventListener('change', filterSongs);
      // 添加表头点击事件
      document.querySelectorAll('th').forEach(header => {
        header.addEventListener('click', () => {
          const sortField = header.getAttribute('data-sort');
          handleSort(sortField);
        });
      });
    } catch (error) {
      console.error('加载歌单失败:', error);
      elements.table.innerHTML = templates.error('加载歌单数据失败');
    }
  };

  init();
});
