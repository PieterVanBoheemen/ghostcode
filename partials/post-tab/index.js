import './style.scss'
import { tabStore } from '#/stores'
import history from '#/history'
import { hScroll, isPostPage } from '#/utils'

$(function() {
  if (!isPostPage()) return

  let $postTabs = $('#J-post-tab')
  let $tabItems
  const $scrollWrap = $('.J-post-tab-scroller-wrap')
  const ndScrollWrap = $scrollWrap.get(0)
  const $iconClose = $scrollWrap.find('.icon-close')[0].outerHTML

  emitter.on('add-post-tab', post => {
    const tabs = tabStore.getTabs()
    if (!tabs.filter(tab => tab.id === post.id).length) {
      tabs.push({ ...post })

      tabStore.setTabs(tabs)
    }

    emitter.emit('tab-refresh', { ...post })
  })

  emitter.on('tab-refresh', (active = {}) => {
    const activeId = active.id
    const tabs = tabStore.getTabs()
    const currentTab = tabStore.currentTab
    const $active = $postTabs
      .html(
        tabs
          .map(
            tab =>
              `<div title="${tab.title}" class="J-tab-item light hover-opacity1 flex-item0 single-line item ${activeId === tab.id ? 'active' : ''}" data-id="${
                tab.id
              }">${tab.title}<i class="close J-post-tab-close lighter hover-opacity1" data-slug="${tab.slug}"><svg class="icon icon-close" t="1515996259220" class="icon" style="" viewBox="0 0 1025 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="10706" xmlns:xlink="http://www.w3.org/1999/xlink" width="1em" height="1em"><defs><style type="text/css"></style></defs><path d="M1010.291623 819.106025c0 0 0 0 0 0L700.976201 509.790603l309.315422-309.315422c0 0 0 0 0 0 3.313639-3.345501 5.735144-7.232654 7.296377-11.374702 4.237634-11.310978 1.816129-24.565533-7.296377-33.678039L864.172904 9.303722c-9.112506-9.112506-22.367061-11.50215-33.678039-7.296377-4.142048 1.529372-8.029201 3.950877-11.374702 7.264515 0 0 0 0 0 0L509.804741 318.619144 200.489319 9.303722c0 0 0 0 0 0-3.345501-3.313639-7.232654-5.735144-11.374702-7.264515-11.34284-4.237634-24.565533-1.816129-33.678039 7.296377L9.317859 155.422441c-9.112506 9.112506-11.50215 22.367061-7.296377 33.678039 1.561234 4.142048 3.950877 8.029201 7.296377 11.374702 0 0 0 0 0 0L318.633281 509.790603 9.317859 819.106025c0 0 0 0 0 0-3.313639 3.345501-5.735144 7.232654-7.296377 11.374702-4.237634 11.310978-1.816129 24.565533 7.296377 33.678039l146.118719 146.118719c9.112506 9.112506 22.367061 11.50215 33.678039 7.296377 4.142048-1.561234 8.029201-3.950877 11.374702-7.296377 0 0 0 0 0 0l309.315422-309.315422 309.315422 309.315422c0 0 0 0 0 0 3.345501 3.313639 7.232654 5.735144 11.374702 7.296377 11.34284 4.237634 24.565533 1.816129 33.678039-7.296377l146.118719-146.118719c9.112506-9.112506 11.534011-22.367061 7.296377-33.678039C1016.026767 826.338679 1013.637124 822.451526 1010.291623 819.106025z" p-id="10707" fill="#ffffff"></path></svg></i></div>`
          )
          .join('')
      )
      .find('.active')

    $tabItems = $postTabs.find('.J-tab-item')

    if (!currentTab) {
      tabStore.setCurrentTab({ ...active })
      history.replace(active.url, { ...active })
    } else {
      tabStore.setCurrentTab({ ...active })
      // not refetch current post
      if (currentTab.id !== activeId && !active.dontTouchHistory) {
        history.push(active.url, { ...active })
      }
    }

    scroll2view($active)
  })

  $postTabs
    .on('click', '.J-post-tab-close', function(e) {
      e.stopPropagation()
      tabStore.deleteTabItem(
        $(this)
          .parent('.J-tab-item')
          .data('id')
      )
    })
    .on('click', '.J-tab-item', function() {
      const $this = $(this)
      if ($this.is('.active')) return

      const id = $this.data('id')
      const currentTab = tabStore.getTabs().filter(tab => tab.id === id)[0] || {}

      $this
        .addClass('active')
        .siblings()
        .removeClass('active')
      tabStore.setCurrentTab(currentTab)
      history.push(currentTab.url, { ...currentTab })

      scroll2view($this)
    })

  /**
   * scroll selected tab item into view if it is out of view
   */
  function scroll2view($active) {
    // wrap element
    const wrapWidth = $scrollWrap.width()
    const wrapScrollLeft = $scrollWrap.scrollLeft()
    const wrapRight = wrapWidth + wrapScrollLeft
    const threshold = 10

    // active element
    const ndActive = $active.get(0)
    if (!ndActive) return
    const activeWidth = $active.outerWidth()
    const activeLeft = ndActive.offsetLeft
    const activeRight = activeLeft + activeWidth
    if (activeRight > wrapWidth + wrapScrollLeft) {
      ndScrollWrap.scrollLeft = activeRight - wrapWidth - threshold
    }
    if (activeLeft <= wrapScrollLeft) {
      ndScrollWrap.scrollLeft = activeLeft - threshold
    }
  }

  hScroll($scrollWrap.get(0))

  history.listen(location => {
    const nextTab = location.state
    if (!nextTab) {return}
    const $active = $tabItems
      .removeClass('active')
      .filter((idx, post) => {
        return $(post).data('id') === nextTab.id
      })
      .addClass('active')

    if ($active.length === 0) {
      emitter.emit('add-post-tab', { ...nextTab, dontTouchHistory: 1 })
    }

    scroll2view($active)
  })
})
