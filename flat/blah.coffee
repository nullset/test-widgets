selectroReducers = (state = {}, action) =>
  # console.log('ACTION:', action.type)
  switch action.type
    when 'INIT'
      return SelectroUtilities.merge(state, action.obj)
    when 'FETCH_OPTIONS'
      return SelectroUtilities.merge(state, action.payload)
    when 'UPDATE_OPTIONS'
      return SelectroUtilities.merge(state, action.payload)
    when 'HIDE_SELECTRO'
      return SelectroUtilities.merge(state, {isFocused: true, query: '', options: state.options})
    when 'UPDATE_QUERY'
      return SelectroUtilities.merge(state, {query: action.query, regex: action.regex})
    # when 'MATCH_OPTIONS'
    #   return SelectroUtilities.merge(state, {options: action.options, hoveredIndex: action.hoveredIndex, hoveredSetVia: action.hoveredSetVia})
    when 'HOVER_PREVIOUS'
      if state.hoveredIndex == 0
        return state
      else
        if action.collapsible
          return SelectroUtilities.merge(state, {hoveredIndex: action.counter, hoveredSetVia: 'keypress'})
        else
          return SelectroUtilities.merge(state, {hoveredIndex: state.hoveredIndex - 1, hoveredSetVia: 'keypress'})
    when 'HOVER_NEXT'
      if action.collapsible
        counter = action.counter
        return SelectroUtilities.merge(state, {hoveredIndex: counter, hoveredSetVia: 'keypress'})
      else if state.hoveredIndex == action.counter - 1
        return state
      else
        counter = state.hoveredIndex + 1
        return SelectroUtilities.merge(state, {hoveredIndex: counter, hoveredSetVia: 'keypress'})
    when 'SET_HOVERED'
      return SelectroUtilities.merge(state, {hoveredIndex: action.hoveredIndex, hoveredSetVia: action.hoveredSetVia})
    when 'SET_HOVERED_SET_VIA'
      return SelectroUtilities.merge(state, {hoveredSetVia: action.hoveredSetVia})
    when 'SET_SELECTED'
      # FIXME : Not sure why we have to first delete the state.value and state.content values when we are removing selected values, but we do :(
      # Probably related to how the "merge" function is working.
      delete state.value
      return SelectroUtilities.merge(state, action.payload)
    # when 'SET_SELECTED_GROUP'
    #   # FIXME : Not sure why we have to first delete the state.value and state.content values when we are removing selected values, but we do :(
    #   # Probably related to how the "merge" function is working.
    #   # delete state.selectedGroups
    #   # delete state.contentGroups
    #   delete state.selected
    #   delete state.content
    #   # debugger
    #   return SelectroUtilities.merge(state, {selected: action.value, content: action.content, query: action.placeholder, hoveredIndex: action.hoveredIndex, options: action.options})
    when 'SET_SHOW_SEARCH'
      action.payload.hoveredIndex ||= 0
      return SelectroUtilities.merge(state, action.payload)
    when 'FILTER_OPTIONS'
      # Have to delete existing options, otherwise the merge causes options that have been filtered out to reappear in the options list.
      delete state.options
      return SelectroUtilities.merge(state, {options: action.options, regex: action.regex, query: action.query, hoveredIndex: action.hoveredIndex, hoveredSetVia: 'keypress'})
    when 'RESET_QUERY'
      return SelectroUtilities.merge(state, {query: '', regex: new RegExp('')})
    when 'CLEAR_SELECTED'
      state.value = []
      # action.payload.query = ''
      # action.regex = new RegExp('')
      return SelectroUtilities.merge(state, action.payload)
    when 'SET_POSITION'
      # Prevent pre-existing style from being merged with new style (should be a complete overwrite, so as to prevent errant top:bottom or right:left issues)
      state = SelectroUtilities.merge({}, state)
      delete state.style
      return SelectroUtilities.merge(state, {style: action.style})
    when 'TOGGLE_ARROW'
      delete state.collapseState
      return SelectroUtilities.merge(state, {collapseState: action.payload})
    else
      return state

@DOMHelper = {
  activate: (event, props = {}) ->
    event.preventDefault()
    event.stopPropagation()
    elem = event.currentTarget || event.target
    modal = document.getElementById('selectro-modal');
    if !modal
      body = document.querySelector('body');
      node = document.createElement('div');
      node.setAttribute('id', 'selectro-modal');
      node.setAttribute('class', 'selectro-modal');
      body.appendChild(node);
      modal = document.getElementById('selectro-modal');

    Array.prototype.slice.call(elem.attributes).forEach (attr)->
      if /^data-/.test(attr.name)
        name = attr.name.replace(/^data-/, '')
      else
        name = attr.name

      if name == 'content'
        if attr.nodeValue == ''
          props[name] = {}
        else
          props[name] = JSON.parse(attr.nodeValue)
      else if name == 'selectrovalue'
        props.value = JSON.parse(attr.nodeValue)
      else
        if name != 'value'
          value = try
            temp = JSON.parse(attr.nodeValue)
            try
              JSON.parse(temp)
            catch
              temp
          catch
            attr.nodeValue
          props[name] = value

    props.element = elem

    elem.focus()

    if props.value
      props.value = props.value.map (opt)-> 
        text = if opt[0] == null then '' else opt[0].toString()
        if opt.length == 1
          value = text
          return {text: text, value: text}
        else
          value = if opt[1] == null then '' else opt[1].toString()
          option = {text: text, value: value}
          if opt.length == 3
            option.meta = opt[2]
          return option
    else
      props.value = []

    if !props.hasOwnProperty('options')
      props.options = []

    props.store = Redux.createStore(selectroReducers)
    React.render(
      React.createElement(Selectro, props),
      modal
    )}