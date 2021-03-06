// built-in functions
;(function($B){

eval($B.InjectBuiltins())

_b_.__debug__ = false

var $ObjectDict = _b_.object.$dict,
    odga = $ObjectDict.__getattribute__

// maps comparison operator to method names
$B.$comps = {'>':'gt','>=':'ge','<':'lt','<=':'le'}
$B.$inv_comps = {'>': 'lt', '>=': 'le', '<': 'gt', '<=': 'ge'}

function check_nb_args(name, expected, got){
    // Check the number of arguments
    if(got != expected){
        if(expected==0){
            throw _b_.TypeError(name+"() takes no argument" +
                " ("+got+" given)")
        }else{
            throw _b_.TypeError(name+"() takes exactly "+expected+" argument" +
                (expected<2 ? '' : 's') +" ("+got+" given)")
        }
    }
}

function check_no_kw(name, x, y){
    // Throw error if one of x, y is a keyword argument
    if(x.$nat || (y!==undefined && y.$nat)){
        throw _b_.TypeError(name+"() takes no keyword arguments")}
}

var $NoneDict = {__class__:$B.$type,__name__:'NoneType'}

$NoneDict.__mro__ = [$ObjectDict]

$NoneDict.__setattr__ = function(self, attr){
    return no_set_attr($NoneDict, attr)
}

var None = {
    __bool__ : function(){return False},
    __class__ : $NoneDict,
    __hash__ : function(){return 0},
    __repr__ : function(){return 'None'},
    __str__ : function(){return 'None'},
    toString : function(){return 'None'}
}

$NoneDict.$factory = function(){return None}
$NoneDict.$factory.__class__=$B.$factory
$NoneDict.$factory.$dict=$NoneDict

for(var $op in $B.$comps){ // None is not orderable with any type
    var key = $B.$comps[$op]
    switch(key){
      case 'ge':
      case 'gt':
      case 'le':
      case 'lt':
        $NoneDict['__'+key+'__']=(function(op){
            return function(other){
            throw _b_.TypeError("unorderable types: NoneType() "+op+" "+
                $B.get_class(other).__name__+"()")}
        })($op)
    }
}
for(var $func in None){
    if(typeof None[$func]==='function'){
        None[$func].__str__ = (function(f){
            return function(){return "<method-wrapper "+f+" of NoneType object>"}
        })($func)
    }
}

function abs(obj){
    check_nb_args('abs', 1, arguments.length)
    check_no_kw('abs', obj)
    if(isinstance(obj,_b_.int)) return _b_.int(Math.abs(obj));
    if(isinstance(obj,_b_.float)) return _b_.float(Math.abs(obj));
    if(hasattr(obj,'__abs__')){return getattr(obj,'__abs__')()};

    throw _b_.TypeError("Bad operand type for abs(): '"+$B.get_class(obj)+"'")
}

function all(obj){
    check_nb_args('all', 1, arguments.length)
    check_no_kw('all', obj)
    var iterable = iter(obj),
        ce = $B.current_exception
    while(1){
        try{
            var elt = next(iterable)
            if(!bool(elt)) return false
        }catch(err){$B.current_exception=ce;return true}
    }
}

function any(obj){
    check_nb_args('any', 1, arguments.length)
    check_no_kw('any', obj)
    var iterable = iter(obj),
        ce = $B.current_exception
    while(1){
        try{
            var elt = next(iterable)
            if(bool(elt)) return true
        }catch(err){$B.current_exception=ce;return false}
    }
}

function ascii(obj) {
    check_nb_args('ascii', 1, arguments.length)
    check_no_kw('ascii', obj)
    var res = repr(obj), res1='', cp
    for(var i=0;i<res.length;i++){
        cp = res.charCodeAt(i)
        if(cp<128){res1 += res.charAt(i)}
        else if(cp<256){res1 += '\\x'+cp.toString(16)}
        else{res1 += '\\u'+cp.toString(16)}
    }
    return res1
}

// used by bin, hex and oct functions
function $builtin_base_convert_helper(obj, base) {
  var prefix = "";
  switch (base) {
     case 2:
       prefix='0b'; break;
     case 8:
       prefix='0o'; break;
     case 16:
       prefix='0x'; break;
     default:
         console.log('invalid base:' + base)
  }

  if (obj.__class__ === $B.LongInt.$dict) {
     if (obj.pos) return prefix + $B.LongInt.$dict.to_base(obj, base)
     return '-' + prefix + $B.LongInt.$dict.to_base(-obj, base)
  }

  var value=$B.$GetInt(obj)

  if (value === undefined) {
     // need to raise an error
     throw _b_.TypeError('Error, argument must be an integer or contains an __index__ function')
  }

  if (value >=0) return prefix + value.toString(base);
  return '-' + prefix + (-value).toString(base);
}


// bin() (built in function)
function bin(obj) {
    check_nb_args('bin', 1, arguments.length)
    check_no_kw('bin', obj)
    if(isinstance(obj, _b_.int)){
        return $builtin_base_convert_helper(obj, 2)
    }
    return getattr(obj, '__index__')()
}

$B.$bool = function(obj){ // return true or false
    if(obj===null || obj === undefined ) return false
    switch(typeof obj) {
      case 'boolean':
        return obj
      case 'number':
      case 'string':
        if(obj) return true
        return false
      default:
        var ce = $B.current_exception
        try{return getattr(obj,'__bool__')()}
        catch(err){
            $B.current_exception = ce
            try{return getattr(obj,'__len__')()>0}
            catch(err){return true}
        }
    }// switch
}

function bool(){
    // This function is exposed as __builtins__.bool, to support the control
    // on arguments provided by $B.$args.
    // It calls $B.$bool, which is used inside the generated JS code and skips
    // arguments control.
    var $=$B.args('bool', 1, {x:null}, ['x'], arguments,{x:false},null,null)
    return $B.$bool($.x)
}

function callable(obj) {
    check_nb_args('callable', 1, arguments.length)
    check_no_kw('callable', obj)

    return hasattr(obj,'__call__')
}

function chr(i) {
    check_nb_args('chr', 1, arguments.length)
    check_no_kw('chr', i)

    if (i < 0 || i > 1114111) _b_.ValueError('Outside valid range')

    return String.fromCharCode(i)
}

//classmethod() (built in function)
function classmethod(func) {
    check_nb_args('classmethod', 1, arguments.length)
    check_no_kw('classmethod', func)

    func.$type = 'classmethod'
    return func
}
classmethod.__class__=$B.$factory
classmethod.$dict = {__class__:$B.$type,
    __name__:'classmethod',
    $factory: classmethod
}
classmethod.$dict.__mro__ = [$ObjectDict]

//compile() (built in function)
$B.$CodeObjectDict = {
    __class__:$B.$type,
    __name__:'code',
    __repr__:function(self){return '<code object '+self.name+', file '+self.filename+'>'},
}
$B.$CodeObjectDict.__str__ = $B.$CodeObjectDict.__repr__
$B.$CodeObjectDict.__mro__ = [$ObjectDict]

function compile(source, filename, mode) {
    var $=$B.args('compile', 6,
        {source:null, filename:null, mode:null, flags:null, dont_inherit:null,
         optimize:null},
         ['source', 'filename', 'mode', 'flags', 'dont_inherit','optimize'],
         arguments,{flags:0, dont_inherit:false, optimize:-1},null,null)

    var module_name = '$exec_' + $B.UUID()
    $B.clear_ns(module_name)
    $.__class__ = $B.$CodeObjectDict
    $.co_flags = $.flags
    return $
}

compile.__class__ = $B.factory
$B.$CodeObjectDict.$factory = compile
compile.$dict = $B.$CodeObjectDict

//function complex is located in py_complex.js

// built-in variable __debug__
var __debug__ = $B.debug>0

function delattr(obj, attr) {
    // descriptor protocol : if obj has attribute attr and this attribute has
    // a method __delete__(), use it
    check_no_kw('delattr', obj, attr)
    check_nb_args('delattr', 2, arguments.length)
    if(typeof attr != 'string'){
        throw _b_.TypeError("attribute name must be string, not '"+
            $B.get_class(attr).__name__+"'")
    }
    var klass = $B.get_class(obj)
    var res = obj[attr]
    if(res===undefined){
        res = klass[attr]
        if(res===undefined){
            var mro = klass.__mro__
            for(var i=0;i<mro.length;i++){
                var res = mro[i][attr]
                if(res!==undefined){break}
            }
        }
    }
    if(res!==undefined && res.__delete__!==undefined){
        res.__delete__(res,obj,attr)
    }else{
        getattr(obj,'__delattr__')(attr)
    }
    return None
}

function dir(obj){

    if(obj===undefined){
        // if dir is called without arguments, use globals
        var frame = $B.last($B.frames_stack),
            globals_obj = frame[3],
            res = _b_.list(),
            pos=0
        for(var attr in globals_obj){
            if(attr.charAt(0)=='$' && attr.charAt(1) != '$') {
                // exclude internal attributes set by Brython
                continue
            }
            res[pos++]=attr
        }
        _b_.list.$dict.sort(res)
        return res
    }

    check_nb_args('dir', 1, arguments.length)
    check_no_kw('dir', obj)

    var klass = obj.__class__ || $B.get_class(obj),
        ce = $B.current_exception
    if(klass && klass.is_class){obj=obj.$dict}
    else {
        // We first look if the object has the __dir__ method
        try {
            var res = getattr(obj, '__dir__')()
            res = _b_.list(res)
            res.sort()
            return res
        } catch (err){}
    }
    $B.current_exception = ce
    var res = [], pos=0
    for(var attr in obj){
        if(attr.charAt(0)!=='$' && attr!=='__class__'){
            res[pos++]=attr
        }
    }
    res.sort()
    return res
}

//divmod() (built in function)
function divmod(x,y) {
   check_no_kw('divmod', x, y)
   check_nb_args('divmod', 2, arguments.length)

   var klass = x.__class__ || $B.get_class(x)
   return _b_.tuple([getattr(klass, '__floordiv__')(x,y),
       getattr(klass, '__mod__')(x,y)])
}

var $EnumerateDict = {__class__:$B.$type,__name__:'enumerate'}
$EnumerateDict.__mro__ = [$ObjectDict]

function enumerate(){
    var $ns = $B.args("enumerate",2,{iterable:null,start:null},
        ['iterable', 'start'],arguments,{start:0}, null, null)
    var _iter = iter($ns["iterable"])
    var _start = $ns["start"]
    var res = {
        __class__:$EnumerateDict,
        __getattr__:function(attr){return res[attr]},
        __iter__:function(){return res},
        __name__:'enumerate iterator',
        __next__:function(){
            res.counter++
            return _b_.tuple([res.counter,next(_iter)])
        },
        __repr__:function(){return "<enumerate object>"},
        __str__:function(){return "<enumerate object>"},
        counter:_start-1
    }
    for(var attr in res){
        if(typeof res[attr]==='function' && attr!=="__class__"){
            res[attr].__str__=(function(x){
                return function(){return "<method wrapper '"+x+"' of enumerate object>"}
            })(attr)
        }
    }
    return res
}
enumerate.__class__ = $B.$factory
enumerate.$dict = $EnumerateDict
$EnumerateDict.$factory = enumerate

//eval() (built in function)
function $eval(src, _globals, _locals){

    function from_alias(attr){
        if(attr.substr(0, 2)=='$$' && $B.aliased_names[attr.substr(2)]){
            return attr.substr(2)
        }
        return attr
    }
    function to_alias(attr){
        if($B.aliased_names[attr]){return '$$'+attr}
        return attr
    }

    var current_frame = $B.frames_stack[$B.frames_stack.length-1]

    if(current_frame!==undefined){
        var current_locals_id = current_frame[0].replace(/\./,'_'),
            current_globals_id = current_frame[2].replace(/\./,'_')
    }

    var stack_len = $B.frames_stack.length

    var is_exec = arguments[3]=='exec',leave = false

    if(src.__class__===$B.$CodeObjectDict){
        src = src.source
    }else if(typeof src !== 'string'){
        throw _b_.TypeError("eval() arg 1 must be a string, bytes "+
            "or code object")
    }

    // code will be run in a specific block
    var globals_id = '$exec_'+$B.UUID(),
        locals_id,
        parent_block_id,
        ce = $B.current_exception

    // If a _globals dictionary is provided, set or reuse its attribute
    // globals_id
    if(_globals !== undefined){
        if(_globals.__class__!=_b_.dict.$dict){
            throw _b_.TypeError("exec() globals must be a dict, not "+
                _globals.__class__.__name__)
        }
        _globals.globals_id = _globals.globals_id || globals_id
        globals_id = _globals.globals_id
    }

    // set module path
    $B.$py_module_path[globals_id] = $B.$py_module_path[current_globals_id]

    if(_globals===undefined){
        if(current_locals_id == current_globals_id){
            locals_id = globals_id
        }else{
            locals_id = '$exec_' + $B.UUID()
        }
    }else{
        if(_locals===_globals || _locals===undefined){
            locals_id = globals_id
        }else{
            locals_id = '$exec_' + $B.UUID()
        }
    }
    // Initialise the object for block namespaces
    eval('var $locals_'+globals_id+' = {}\nvar $locals_'+locals_id+' = {}')

    // Initialise block globals
    if(_globals===undefined){
        var gobj = current_frame[3],
            ex = ''
        parent_block_id = current_globals_id
        ex += 'var $locals_'+current_globals_id+'=gobj;' // needed for generators
        ex += 'var $locals_'+globals_id+'=gobj;'
        eval(ex)
        $B.bound[globals_id] = $B.bound[globals_id] ||  {}
        for(var attr in gobj){
            $B.bound[globals_id][attr] = true
        }
    }else{
        $B.bound[globals_id] = {}
        var items = _globals.$string_dict
        for(var item in items){
            item1 = to_alias(item)
            try{
                eval('$locals_'+globals_id+'["'+item1+'"] = items[item]')
                $B.bound[globals_id][item]=true
            }catch(err){
                console.log(err)
                console.log('error setting', item)
                break
            }
        }
        parent_block_id = '__builtins__'
    }

    // Initialise block locals
    $B.bound[locals_id] = $B.bound[locals_id] || {}
    if(_locals===undefined){
        if(_globals!==undefined){
            eval('var $locals_'+locals_id+' = $locals_'+globals_id)
        }else{
            var lobj = current_frame[1],
                ex = ''
            for(var attr in current_frame[1]){
                ex += '$locals_'+locals_id+'["'+attr+
                    '"] = current_frame[1]["'+attr+'"];'
                $B.bound[locals_id][attr] = true
            }
            eval(ex)
        }
    }else{
        var items = _b_.dict.$dict.items(_locals), item
        while(1){
            try{
                var item = next(items)
                item1 = to_alias(item)
                eval('$locals_'+locals_id+'["'+item[0]+'"] = item[1]')
                $B.bound[locals_id][item] = true
            }catch(err){
                break
            }
        }
    }

    $B.current_exception = ce

    var root = $B.py2js(src, globals_id, locals_id, parent_block_id),
        js, gns, lns

    try{
        // The result of py2js ends with
        // try{
        //     (block code)
        //     $B.leave_frame($local_name)
        // }catch(err){
        //     $B.leave_frame($local_name)
        //     throw err
        // }
        var try_node = root.children[root.children.length-2],
            instr = try_node.children[try_node.children.length-2]
        // type of the last instruction in (block code)
        var type = instr.context.tree[0].type

        // If the Python function is eval(), not exec(), check that the source
        // is an expression

        switch(type){

            case 'expr':
            case 'list_or_tuple':
            case 'op':
            case 'ternary':
                // If the source is an expression, what we must execute is the
                // block inside the "try" clause : if we run root, since it's
                // wrapped in try / finally, the value produced by
                // eval(root.to_js()) will be None
                var children = try_node.children
                root.children.splice(root.children.length-2, 2)
                for(var i=0;i<children.length-1;i++){
                    root.add(children[i])
                }
                break
            default:
                if(!is_exec){
                    throw _b_.SyntaxError("eval() argument must be an expression",
                        '<string>', 1, 1, src)
                }
        }

        js = root.to_js()
        var res = eval(js)

        gns = eval('$locals_'+globals_id)
        if($B.frames_stack[$B.frames_stack.length-1][2] == globals_id){
            gns = $B.frames_stack[$B.frames_stack.length-1][3]
        }

        // Update _locals with the namespace after execution
        if(_locals!==undefined){
            lns = eval('$locals_'+locals_id)
            var setitem = getattr(_locals,'__setitem__')
            for(var attr in lns){
                attr1 = from_alias(attr)
                if(attr1.charAt(0)!='$'){setitem(attr1, lns[attr])}
            }
        }else{
            for(var attr in lns){
                current_frame[1][attr] = lns[attr]
            }
        }

        if(_globals!==undefined){
            // Update _globals with the namespace after execution
            var setitem = getattr(_globals,'__setitem__')
            for(var attr in gns){
                attr1 = from_alias(attr)
                if(attr1.charAt(0)!='$'){setitem(attr1, gns[attr])}
            }
        }else{
            for(var attr in gns){
                current_frame[3][attr] = gns[attr]
            }
        }

        // fixme: some extra variables are bleeding into locals...
        /*  This also causes issues for unittests */
        if(res===undefined) return _b_.None
        return res
    }catch(err){
        if(err.$py_error===undefined){throw $B.exception(err)}
        throw err
    }finally{
        // "leave_frame" was removed so we must execute it here
        if($B.frames_stack.length == stack_len+1){
            $B.frames_stack.pop()
        }

        root = null
        js = null
        gns = null
        lns = null

        $B.clear_ns(globals_id)
        $B.clear_ns(locals_id)

    }
}
$eval.$is_func = true

function exec(src, globals, locals){
    return $eval(src, globals, locals,'exec') || _b_.None
}

exec.$is_func = true

var $FilterDict = {__class__:$B.$type,__name__:'filter'}
$FilterDict.__iter__ = function(self){return self}
$FilterDict.__repr__ = $FilterDict.__str__ = function(){return "<filter object>"},
$FilterDict.__mro__ = [$ObjectDict]

function filter(func, iterable){
    check_no_kw('filter', func, iterable)
    check_nb_args('filter', 2, arguments.length)

    iterable=iter(iterable)
    if(func === _b_.None) func = bool

    var __next__ = function() {
        while(true){
            var _item = next(iterable)
            if (func(_item)){return _item}
        }
    }
    return {
        __class__: $FilterDict,
        __next__: __next__
    }
}

function format(value, format_spec) {
  var args = $B.args("format",2,{value:null,format_spec:null},
      ["value","format_spec"],arguments,{format_spec:''},null,null)
  var fmt = getattr(args.value,'__format__', null)
  if(fmt !== null){return fmt(args.format_spec)}
  throw _b_.NotImplementedError("__format__ is not implemented for object '" +
      _b_.str(args.value) + "'")
}

function attr_error(attr, cname){
    var msg = "bad operand type for unary #: '"+cname+"'"
    switch(attr){
        case '__neg__':
            throw _b_.TypeError(msg.replace('#','-'))
        case '__pos__':
            throw _b_.TypeError(msg.replace('#','+'))
        case '__invert__':
            throw _b_.TypeError(msg.replace('#','~'))
        case '__call__':
            throw _b_.TypeError("'"+cname+"'"+' object is not callable')
        default:
            while(attr.charAt(0)=='$'){attr = attr.substr(1)}
            throw _b_.AttributeError("'"+cname+"' object has no attribute '"+attr+"'")
    }
}

$B.show_getattr = function(){
    var items = []
    for(var attr in $B.counter){items.push([$B.counter[attr], attr])}
    items.sort(function(x,y){
        return x[0]>y[0] ? 1 : x[0]==y[0] ? 0 : -1
    })
    items.reverse()
    for(var i=0;i<10;i++){console.log(items[i])}
}

function getattr(obj,attr,_default){

    var len = arguments.length
    if(len<2){throw _b_.TypeError("getattr expected at least 2 arguments, "
        + "got "+len)}
    else if(len>3){
        throw _b_.TypeError("getattr expected at most 3 arguments, got "
            +len)
    }
    return $B.$getattr(obj, attr, _default)
}

$B.$getattr = function(obj, attr, _default){

    // Used internally to avoid having to parse the arguments
    var rawname = attr
    if($B.aliased_names[attr]){attr = '$$'+attr}

    var klass = obj.__class__

    // Shortcut for classes without parents
    if(klass!==undefined && klass.__bases__ && klass.__bases__.length==0){
        if(obj.hasOwnProperty(attr)){
            return obj[attr]
        }else if(klass.hasOwnProperty(attr)){
            if(typeof klass[attr] != "function" && attr != "__dict__" &&
                    klass[attr].__get__===undefined){
                return klass[attr]
            }
        }
    }

    if(klass===undefined){
        // avoid calling $B.get_class in simple cases for performance
        if(typeof obj=='string'){klass = _b_.str.$dict}
        else if(typeof obj=='number'){
            klass = obj % 1 == 0 ? _b_.int.$dict : _b_.float.$dict
        }else if(obj instanceof Number){
            klass = _b_.float.$dict
        }else{
            klass = $B.get_class(obj)
        }
    }

    if(klass===undefined){
        // for native JS objects used in Python code
        if(obj.hasOwnProperty(attr)){
            if(typeof obj[attr]=="function"){
                return function(){
                    // In function, "this" is set to the object
                    return obj[attr].apply(obj, arguments)
                }
            }else{
                return $B.$JS2Py(obj[attr])
            }
        }
        if(_default!==undefined) return _default
        throw _b_.AttributeError('object has no attribute '+rawname)
    }

    switch(attr) {
      case '__call__':
        if (typeof obj=='function'){
           return obj
        } else if (klass===$B.JSObject.$dict && typeof obj.js=='function'){
          return function(){
              // apply Javascript function to arguments converted from
              // Python objects to JS or DOM objects
              var args = []
              for(var i=0; i<arguments.length; i++){
                  args.push($B.pyobj2jsobj(arguments[i]))
              }
              var res = obj.js.apply(null, args)
              if(res===undefined){return None} // JSObject would throw an exception
              // transform JS / DOM result in Python object
              return $B.JSObject(res)
          }
        }
        break
      case '__class__':
        // attribute __class__ is set for all Python objects
        // return the factory function
        return klass.$factory
      case '__dict__':
        // attribute __dict__ returns a dictionary wrapping obj
        if(klass.is_class && klass.__dict__){return klass.__dict__}
        return $B.obj_dict(obj) // defined in py_dict.js
      case '__doc__':
        // for builtins objects, use $B.builtins_doc
        for(var i=0;i<builtin_names.length;i++){
            if(obj===_b_[builtin_names[i]]){
                  _get_builtins_doc()
                return $B.builtins_doc[builtin_names[i]]
            }
        }
        break
      case '__mro__':
        if(klass===$B.$factory){
            // The attribute __mro__ of classes is a list of class
            // dictionaries ; it must be returned as a list of class
            // factory functions
            var res = [obj],
                pos = 0,
                mro = obj.$dict.__mro__
            for(var i=0;i<mro.length;i++){
                res.push(mro[i].$factory)
            }
            return _b_.tuple(res)
        }
        break
      case '__subclasses__':
          if(klass===$B.$factory){
              var subclasses = obj.$dict.$subclasses || []
              return function(){return subclasses}
          }
        break
      case '$$new':
        if (klass===$B.JSObject.$dict && obj.js_func !== undefined){
          return $B.JSConstructor(obj)
        }
        break
    }//switch

    if(typeof obj == 'function') {
      var value = obj.__class__ === $B.$factory ? obj.$dict[attr] : obj[attr]
      if(value !== undefined) {
        if (attr == '__module__'){
          return value
        }
      }
    }

    if(klass.$native){
        if(klass[attr]===undefined){
            var object_attr = _b_.object.$dict[attr]
            if(object_attr!==undefined){klass[attr]=object_attr}
            else{
                if(_default===undefined){attr_error(attr, klass.__name__)}
                return _default
            }
        }
        if(klass.$descriptors && klass.$descriptors[attr]!==undefined){
            return klass[attr](obj)
        }
        if(typeof klass[attr]=='function'){

            // new is a static method
            if(attr=='__new__') return klass[attr].apply(null,arguments)

            // return classmethods unchanged
            if(klass[attr].$type=='classmethod'){
                var res = function(){
                    var args = [klass.$factory]
                    for(var i=0; i<arguments.length;i++){args.push(arguments[i])}
                    return klass[attr].apply(null, args)
                }
                res.$type = 'classmethod'
                res.$infos = klass[attr].$infos
                return res
            }

            var method = function(){
                var args = [obj], pos=1
                for(var i=0;i<arguments.length;i++){args[pos++]=arguments[i]}
                return klass[attr].apply(null,args)
            }
            method.__class__ = $B.$MethodDict
            method.$infos = {
                __class__: klass.$factory,
                __func__ : klass[attr],
                __name__ : attr,
                __self__ : obj
            }
            method.__str__ = method.__repr__ = function(){
                return '<built-in method '+attr+' of '+klass.__name__+' object>'
            }
            return method
        }
        return klass[attr]
    }

    var is_class = klass.is_class, mro, attr_func

    if(is_class){
        attr_func=$B.$type.__getattribute__
        if(obj.$dict===undefined){console.log('obj '+obj+' $dict undefined')}
        obj=obj.$dict
    }else{
        attr_func = klass.__getattribute__
        if(attr_func===undefined){
            var mro = klass.__mro__
            for(var i=0, len=mro.length;i<len;i++){
                attr_func = mro[i]['__getattribute__']
                if(attr_func!==undefined){break}
            }
        }
    }
    if(typeof attr_func!=='function'){
        console.log(attr+' is not a function '+attr_func)
    }

    if(attr_func===odga){
        var res = obj[attr]
        if(res===null){return null}
        else if(res===undefined && obj.hasOwnProperty(attr)){
            return res
        }else if(res!==undefined && res.__set__===undefined){
            return obj[attr]
        }
    }

    try{
        var res = attr_func(obj, attr)
    }
    catch(err){
        if(_default!==undefined) return _default
        throw err
    }

    if(res!==undefined){return res}
    if(_default !==undefined){return _default}

    var cname = klass.__name__
    if(is_class){cname=obj.__name__}

    attr_error(rawname, cname)
}

//globals() (built in function)

function globals(){
    // The last item in __BRYTHON__.frames_stack is
    // [locals_name, locals_obj, globals_name, globals_obj]
    check_nb_args('globals', 0, arguments.length)
    return $B.obj_dict($B.last($B.frames_stack)[3])
}

function hasattr(obj,attr){
    check_no_kw('hasattr', obj, attr)
    check_nb_args('hasattr', 2, arguments.length)
    var ce = $B.current_exception
    try{getattr(obj,attr);return true}
    catch(err){$B.current_exception=ce;return false}
}

function hash(obj){
    check_no_kw('hash', obj)
    check_nb_args('hash', 1, arguments.length)

    if (obj.__hashvalue__ !== undefined) return obj.__hashvalue__
    if (isinstance(obj, _b_.int)) return obj.valueOf()
    if (isinstance(obj, bool)) return _b_.int(obj)
    if (obj.__hash__ !== undefined) {
       return obj.__hashvalue__=obj.__hash__()
    }
    if(obj.__class__===$B.$factory){
        return obj.__hashvalue__ = $B.$py_next_hash--
    }
    var hashfunc = getattr(obj, '__hash__', _b_.None)

    if (hashfunc == _b_.None){
        // return obj.__hashvalue__=$B.$py_next_hash--
        throw _b_.TypeError("unhashable type: '"+
                $B.get_class(obj).__name__+"'", 'hash')
    }

    if(hashfunc.$infos === undefined){
        return obj.__hashvalue__ = hashfunc()
    }

    // If no specific __hash__ method is supplied for the instance but
    // a __eq__ method is defined, the object is not hashable
    //
    // class A:
    //     def __eq__(self, other):
    //         return False
    //
    // d = {A():1}
    //
    // throws an exception : unhashable type: 'A'

    if(hashfunc.$infos.__func__===_b_.object.$dict.__hash__){
        if(getattr(obj,'__eq__').$infos.__func__!==_b_.object.$dict.__eq__){
            throw _b_.TypeError("unhashable type: '"+
                $B.get_class(obj).__name__+"'", 'hash')
        }else{
            return _b_.object.$dict.__hash__(obj)
        }
    }else{
        return obj.__hashvalue__= hashfunc()
    }
}

function _get_builtins_doc(){
    if($B.builtins_doc===undefined){
        // Load builtins docstrings from file builtins_doctring.js
        var url = $B.brython_path
        if(url.charAt(url.length-1)=='/'){url=url.substr(0,url.length-1)}
        url += '/builtins_docstrings.js'
        var f = _b_.open(url)
        eval(f.$content)
        $B.builtins_doc = docs
    }
}

function help(obj){
    if (obj === undefined) obj='help'

    // if obj is a builtin, lets take a shortcut, and output doc string
    if(typeof obj=='string' && _b_[obj] !== undefined) {
        _get_builtins_doc()
        var _doc=$B.builtins_doc[obj]
        if (_doc !== undefined && _doc != '') {
             _b_.print(_doc)
             return
        }
    }
    // If obj is a built-in object, also use builtins_doc
    for(var i=0;i<builtin_names.length;i++){
        if(obj===_b_[builtin_names[i]]){
              _get_builtins_doc()
            _b_.print(_doc = $B.builtins_doc[builtin_names[i]])
        }
    }
    if(typeof obj=='string'){
        $B.$import("pydoc");
        var pydoc=$B.imported["pydoc"]
        getattr(getattr(pydoc,"help"),"__call__")(obj)
        return
    }
    var ce = $B.current_exception
    try{return getattr(obj,'__doc__')}
    catch(err){$B.current_exception = ce;return ''}
}

function hex(x) {
    check_no_kw('hex', x)
    check_nb_args('hex', 1, arguments.length)
    return $builtin_base_convert_helper(x, 16)
}

function id(obj) {
   check_no_kw('id', obj)
   check_nb_args('id', 1, arguments.length)
   if (isinstance(obj, [_b_.str, _b_.int, _b_.float])){
       return getattr(_b_.str(obj), '__hash__')()
   }else if(obj.$id!==undefined){return obj.$id}
   else{return obj.$id = $B.UUID()}
}

// The default __import__ function is a builtin
function __import__(mod_name, globals, locals, fromlist, level) {
    // TODO : Install $B.$__import__ in builtins module to avoid nested call
    var $ = $B.args('__import__',5,
        {name:null,globals:null,locals:null,fromlist:null,level:null},
        ['name', 'globals', 'locals', 'fromlist', 'level'],
        arguments, {globals:None, locals:None, fromlist:_b_.tuple(), level:0},
        null, null)
    return $B.$__import__($.name, $.globals, $.locals, $.fromlist);
}

//not a direct alias of prompt: input has no default value
function input(src) {
    var stdin = ($B.imported.sys && $B.imported.sys.stdin || $B.stdin);
    if (stdin.__original__) { return prompt(src || '') || '' }
    var val = _b_.getattr(stdin, 'readline')();
    val = val.split('\n')[0];
    if (stdin.len === stdin.pos){
        _b_.getattr(stdin, 'close')();
    }
    // $B.stdout.write(val+'\n'); // uncomment if we are to mimic the behavior in the console
    return val;
}

function isinstance(obj,arg){
    check_no_kw('isinstance', obj, arg)
    check_nb_args('isinstance', 2, arguments.length)
    if(obj===null) return arg===None
    if(obj===undefined) return false
    if(arg.constructor===Array){
        for(var i=0;i<arg.length;i++){
            if(isinstance(obj,arg[i])) return true
        }
        return false
    }
    if(arg===_b_.int &&(obj===True || obj===False)){return True}

    var klass = obj.__class__

    if(klass==undefined){
        if(typeof obj=='string' && arg==_b_.str){return true}
        if(obj.contructor==Number && arg==_b_.float){return true}
        if(typeof obj=='number' && arg==_b_.int){return true}
        klass = $B.get_class(obj)
    }

    if (klass === undefined) { return false }

   // arg is the class constructor ; the attribute __class__ is the
   // class dictionary, ie arg.$dict

   if(arg.$dict===undefined){return false}

   if(klass==$B.$factory){klass = obj.$dict.__class__}

   // Return true if one of the parents of obj class is arg
   // If one of the parents is the class used to inherit from str, obj is an
   // instance of str ; same for list

   function check(kl, arg){
      if(kl === arg.$dict){return true}
      else if(arg===_b_.str &&
          kl===$B.$StringSubclassFactory.$dict){return true}
      else if(arg===_b_.float &&
          kl===$B.$FloatSubclassFactory.$dict){return true}
      else if(arg===_b_.list &&
          kl===$B.$ListSubclassFactory.$dict){return true}
   }
   if(check(klass, arg)){return true}
   var mro = klass.__mro__
   for(var i=0;i<mro.length;i++){
      if(check(mro[i], arg)){return true}
   }

    // Search __instancecheck__ on arg
    var hook = getattr(arg,'__instancecheck__',null)
    if(hook!==null){return hook(obj)}

   return false
}

function issubclass(klass,classinfo){
    check_no_kw('issubclass', klass, classinfo)
    check_nb_args('issubclass', 2, arguments.length)

    if(!klass.__class__ || klass.__class__!==$B.$factory){
      throw _b_.TypeError("issubclass() arg 1 must be a class")
    }
    if(isinstance(classinfo,_b_.tuple)){
      for(var i=0;i<classinfo.length;i++){
         if(issubclass(klass,classinfo[i])) return true
      }
      return false
    }
    if(classinfo.__class__.is_class){
        if(klass.$dict===classinfo.$dict ||
            klass.$dict.__mro__.indexOf(classinfo.$dict)>-1){return true}
    }

    // Search __subclasscheck__ on classinfo
    var hook = getattr(classinfo,'__subclasscheck__',null)
    if(hook!==null){return hook(klass)}

    return false

}

// Utility class for iterators built from objects that have a __getitem__ and
// __len__ method
var iterator_class = $B.make_class({name:'iterator',
    init:function(self,getitem,len){
        self.getitem = getitem
        self.len = len
        self.counter = -1
    }
})
iterator_class.$dict.__next__ = function(self){
    self.counter++
    if(self.len!==null && self.counter==self.len){throw _b_.StopIteration('')}
    try{return self.getitem(self.counter)}
    catch(err){throw _b_.StopIteration('')}
}

$B.$iter = function(obj){
    // Function used internally by core Brython modules, to avoid the cost
    // of arguments control
    try{var _iter = getattr(obj,'__iter__')}
    catch(err){
        var gi = getattr(obj,'__getitem__',null),
            ln = getattr(obj,'__len__',null)
        if(gi!==null){
            if(ln!==null){
                var len = getattr(ln,'__call__')()
                return iterator_class(gi,len)
            }else{
                return iterator_class(gi,null)
            }
      }
      throw _b_.TypeError("'"+$B.get_class(obj).__name__+"' object is not iterable")
    }
    var res = _iter(),
        ce = $B.current_exception
    try{getattr(res,'__next__')}
    catch(err){
        if(isinstance(err,_b_.AttributeError)){throw _b_.TypeError(
            "iter() returned non-iterator of type '"+
             $B.get_class(res).__name__+"'")}
    }
    $B.current_exception = ce
    return res
}

function iter(){
    // Function exposed to Brython programs, with arguments control
    var $ = $B.args('iter', 1, {obj: null}, ['obj'], arguments,
        null, 'kw')
    return $B.$iter($.obj)
}

function len(obj){
    check_no_kw('len', obj)
    check_nb_args('len', 1, arguments.length)

    try{return getattr(obj,'__len__')()}
    catch(err){
        throw _b_.TypeError("object of type '"+$B.get_class(obj).__name__+
            "' has no len()")
    }
}

function locals(){
    // The last item in __BRYTHON__.frames_stack is
    // [locals_name, locals_obj, globals_name, globals_obj]
    check_nb_args('locals', 0, arguments.length)
    var locals_obj = $B.last($B.frames_stack)[1]
    return $B.obj_dict(locals_obj)
}


var $MapDict = {__class__:$B.$type,__name__:'map'}
$MapDict.__mro__ = [$ObjectDict]
$MapDict.__iter__ = function (self){return self}

function map(){
    var $ = $B.args('map', 2, {func: null, it1:null}, ['func', 'it1'],
        arguments, {}, 'args', null),
        func = getattr($.func,'__call__')
    var iter_args = [$B.$iter($.it1)]
    for(var i=0;i<$.args.length;i++){
        iter_args.push($B.$iter($.args[i]))
    }
    var __next__ = function(){
        var args = [], pos=0
        for(var i=0;i<iter_args.length;i++){
            args[pos++]=next(iter_args[i])
        }
        return func.apply(null,args)
    }
    var obj = {
        __class__:$MapDict,
        __repr__:function(){return "<map object>"},
        __str__:function(){return "<map object>"},
        __next__: __next__
    }
    return obj
}


function $extreme(args,op){ // used by min() and max()
    var $op_name='min'
    if(op==='__gt__') $op_name = "max"

    if(args.length==0){throw _b_.TypeError($op_name+" expected 1 arguments, got 0")}
    var last_arg = args[args.length-1],
        nb_args = args.length,
        has_default = false,
        func = false
    if(last_arg.$nat=='kw'){
        nb_args--
        last_arg = last_arg.kw
        for(var attr in last_arg){
            switch(attr){
                case 'key':
                    func = last_arg[attr]
                    break
                case '$$default': // Brython changes "default" to "$$default"
                    var default_value = last_arg[attr]
                    has_default = true
                    break
                default:
                    throw _b_.TypeError("'"+attr+"' is an invalid keyword argument for this function")
            }
        }
    }
    if(!func){func = function(x){return x}}
    if(nb_args==0){
        throw _b_.TypeError($op_name+" expected 1 argument, got 0")
    }else if(nb_args==1){
        // Only one positional argument : it must be an iterable
        var $iter = iter(args[0]),
            res = null,
            ce = $B.current_exception
        while(true){
            try{
                var x = next($iter)
                if(res===null || bool(getattr(func(x),op)(func(res)))){res = x}
            }catch(err){
                if(err.__name__=="StopIteration"){
                    $B.current_exception = ce
                    if(res===null){
                        if(has_default){return default_value}
                        else{throw _b_.ValueError($op_name+"() arg is an empty sequence")}
                    }else{return res}
                }
                throw err
            }
        }
    }else{
        if(has_default){
           throw _b_.TypeError("Cannot specify a default for "+$op_name+"() with multiple positional arguments")
        }
        var res = null
        for(var i=0;i<nb_args;i++){
            var x = args[i]
            if(res===null || bool(getattr(func(x),op)(func(res)))){res = x}
        }
        return res
    }
}

function max(){
    var args = [], pos=0
    for(var i=0;i<arguments.length;i++){args[pos++]=arguments[i]}
    return $extreme(args,'__gt__')
}

var memoryview = $B.make_class({name:'memoryview',
    init:function(self, obj){
        check_no_kw('memoryview', obj)
        check_nb_args('memoryview', 2, arguments.length)
        if($B.get_class(obj).$buffer_protocol){
            self.obj = obj
            // XXX fix me : next values are only for bytes and bytearray
            self.format = 'B'
            self.itemsize = 1
            self.ndim = 1
            self.shape = _b_.tuple([self.obj.source.length])
            self.strides = _b_.tuple([1])
            self.suboffsets = _b_.tuple([])
            self.c_contiguous = true
            self.f_contiguous = true
            self.contiguous = true
        }else{
            throw _b_.TypeError("memoryview: a bytes-like object "+
                "is required, not '"+$B.get_class(obj).__name__+"'")
        }
    }
})
memoryview.$dict.__eq__ = function(self, other){
    if(other.__class__!==memoryview.$dict){return false}
    return getattr(self.obj, '__eq__')(other.obj)
}
memoryview.$dict.__name__ = "memory"
memoryview.$dict.__getitem__ = function(self, key){
    var res = self.obj.__class__.__getitem__(self.obj, key)
    if(key.__class__===_b_.slice.$dict){return memoryview(res)}
    return res
}
memoryview.$dict.hex = function(self){
    var res = '',
        bytes = _b_.bytes(self)
    for(var i=0,len=bytes.source.length; i<len; i++){
        res += bytes.source[i].toString(16)
    }
    return res
}
memoryview.$dict.tobytes = function(self){
    return _b_.bytes(self.obj)
}
memoryview.$dict.tolist = function(self){
    return _b_.list(_b_.bytes(self.obj))
}


function min(){
    var args = [], pos=0
    for(var i=0;i<arguments.length;i++){args[pos++]=arguments[i]}
    return $extreme(args,'__lt__')
}

function next(obj){
    check_no_kw('next', obj)
    check_nb_args('next', 1, arguments.length)
    var ga = getattr(obj,'__next__')
    if(ga!==undefined) return ga()
    throw _b_.TypeError("'"+$B.get_class(obj).__name__+
        "' object is not an iterator")
}

var $NotImplemented = $B.make_class({__name__:"NotImplementedClass"}),
    NotImplemented = $NotImplemented()

function $not(obj){return !bool(obj)}

function oct(x) {return $builtin_base_convert_helper(x, 8)}

function ord(c) {
    check_no_kw('ord', c)
    check_nb_args('ord', 1, arguments.length)
    //return String.charCodeAt(c)  <= this returns an undefined function error
    // see http://msdn.microsoft.com/en-us/library/ie/hza4d04f(v=vs.94).aspx
    if(typeof c=='string'){
        if (c.length == 1) return c.charCodeAt(0)     // <= strobj.charCodeAt(index)
        throw _b_.TypeError('ord() expected a character, but string of length ' +
            c.length + ' found')
    }
    switch($B.get_class(c)) {
      case _b_.str.$dict:
        if (c.length == 1) return c.charCodeAt(0)     // <= strobj.charCodeAt(index)
        throw _b_.TypeError('ord() expected a character, but string of length ' +
            c.length + ' found')
      case _b_.bytes.$dict:
      case _b_.bytearray.$dict:
        if (c.source.length == 1) return c.source[0]     // <= strobj.charCodeAt(index)
        throw _b_.TypeError('ord() expected a character, but string of length ' +
            c.source.length + ' found')
      default:
        throw _b_.TypeError('ord() expected a character, but ' +
            $B.get_class(c).__name__ + ' was found')
    }
}

function pow() {
    var $ns=$B.args('pow',3,{x:null,y:null,z:null},['x','y','z'],
        arguments,{z:null},null,null)
    var x=$ns['x'],y=$ns['y'],z=$ns['z']
    var res = getattr(x,'__pow__')(y, z)
    if(z === null){return res}
    else{
        if(x!=_b_.int(x) || y != _b_.int(y)){
            throw _b_.TypeError("pow() 3rd argument not allowed unless "+
                "all arguments are integers")
        }
        return getattr(res,'__mod__')(z)
    }
}

function $print(){
    var $ns=$B.args('print',0,{},[],arguments,
        {},'args', 'kw')
    var ks = $ns['kw'].$string_dict
    var end = (ks['end'] === undefined || ks['end'] === None) ? '\n' : ks['end'],
        sep = (ks['sep'] === undefined || ks['sep'] === None) ? ' ' : ks['sep'],
        file = ks['file'] === undefined ? $B.stdout : ks['file'],
        args = $ns['args']

    getattr(file,'write')(args.map(_b_.str).join(sep)+end)
    return None
}
$print.__name__ = 'print'
$print.is_func = true

// property (built in function)
var $PropertyDict = {
    __class__ : $B.$type,
    __name__ : 'property',
}
$PropertyDict.__mro__ = [$ObjectDict]
$B.$PropertyDict = $PropertyDict

function property(fget, fset, fdel, doc) {
    var p = {
        __class__ : $PropertyDict,
        __doc__ : doc || "",
        $type:fget.$type,
        fget:fget,
        fset:fset,
        fdel:fdel,
        toString:function(){return '<property>'}
    }
    p.__get__ = function(self,obj,objtype) {
        if(obj===undefined) return self
        if(self.fget===undefined) throw _b_.AttributeError("unreadable attribute")
        return getattr(self.fget,'__call__')(obj)
    }
    if(fset!==undefined){
        p.__set__ = function(self,obj,value){
            if(self.fset===undefined) throw _b_.AttributeError("can't set attribute")
            getattr(self.fset,'__call__')(obj,value)
        }
    }
    p.__delete__ = fdel;

    p.getter = function(fget){return property(fget, p.fset, p.fdel, p.__doc__)}
    p.setter = function(fset){return property(p.fget, fset, p.fdel, p.__doc__)}
    p.deleter = function(fdel){return property(p.fget, p.fset, fdel, p.__doc__)}
    return p
}

property.__class__ = $B.$factory
property.$dict = $PropertyDict
$PropertyDict.$factory = property

function repr(obj){
    check_no_kw('repr', obj)
    check_nb_args('repr', 1, arguments.length)
    if(obj.__class__===$B.$factory){
        // obj is a class (the factory function)
        // In this case, repr() doesn't use the attribute __repr__ of the
        // class or its subclasses, but the attribute __repr__ of the
        // class metaclass (usually "type") or its subclasses (usually
        // "object")
        // The metaclass is the attribute __class__ of the class dictionary
        var func = $B.$type.__getattribute__(obj.$dict.__class__,'__repr__')
        return func(obj)
    }
    var func = getattr(obj,'__repr__')
    if(func!==undefined){return func()}
    throw _b_.AttributeError("object has no attribute __repr__")
}

var $ReversedDict = {__class__:$B.$type,__name__:'reversed'}
$ReversedDict.__mro__ = [$ObjectDict]
$ReversedDict.__iter__ = function(self){return self}
$ReversedDict.__next__ = function(self){
    self.$counter--
    if(self.$counter<0) throw _b_.StopIteration('')
    return self.getter(self.$counter)
}

function reversed(seq){
    // Return a reverse iterator. seq must be an object which has a
    // __reversed__() method or supports the sequence protocol (the __len__()
    // method and the __getitem__() method with integer arguments starting at
    // 0).

    check_no_kw('reversed', seq)
    check_nb_args('reversed', 1, arguments.length)

    var ce = $B.current_exception

    try{return getattr(seq,'__reversed__')()}
    catch(err){
        if(err.__name__!='AttributeError'){throw err}
    }
    $B.current_exception = ce

    try{
        var res = {
            __class__:$ReversedDict,
            $counter : getattr(seq,'__len__')(),
            getter:getattr(seq,'__getitem__')
        }
        return res
    }catch(err){
        throw _b_.TypeError("argument to reversed() must be a sequence")
    }
}
reversed.__class__=$B.$factory
reversed.$dict = $ReversedDict
$ReversedDict.$factory = reversed

function round(arg,n){
    var $ = $B.args('round', 2, {number:null, ndigits:null},
        ['number', 'ndigits'], arguments, {ndigits: None}, null, null),
        arg = $.number, n = $.ndigits

    if(!isinstance(arg,[_b_.int,_b_.float])){
        if (!hasattr(arg,'__round__'))
            throw _b_.TypeError("type "+arg.__class__+
                " doesn't define __round__ method")
        if(n===undefined) return getattr(arg,'__round__')()
        else return getattr(arg,'__round__')(n)
    }

    if(isinstance(arg, _b_.float) &&
        (arg.value === Infinity || arg.value === -Infinity)) {
      throw _b_.OverflowError("cannot convert float infinity to integer")
    }

    if(n===None){
        var floor = Math.floor(arg)
        var diff = Math.abs(arg-floor)
        if (diff == 0.5){
            if (floor % 2){return Math.round(arg)}else{return Math.floor(arg)}
        }else{
            return _b_.int(Math.round(arg))
        }
    }
    if(!isinstance(n,_b_.int)){throw _b_.TypeError(
        "'"+n.__class__+"' object cannot be interpreted as an integer")}
    var mult = Math.pow(10,n)
    if(isinstance(arg, _b_.float)) {
        return _b_.float(_b_.int.$dict.__truediv__(Number(Math.round(arg.valueOf()*mult)),mult))
    } else {
        return _b_.int(_b_.int.$dict.__truediv__(Number(Math.round(arg.valueOf()*mult)),mult))
    }
}

function setattr(){

    var $ = $B.args('setattr', 3, {obj:null, attr:null, value:null},
        ['obj', 'attr', 'value'], arguments, {}, null, null),
        obj = $.obj, attr=$.attr, value=$.value
    if(!(typeof attr=='string')){
        throw _b_.TypeError("setattr(): attribute name must be string")
    }
    return $B.$setattr(obj, attr, value)
}

$B.$setattr = function(obj, attr, value){
    // Used in the code generated by py2js. Avoids having to parse the
    // since we know we will get the 3 values
    if($B.aliased_names[attr]){
        attr = '$$' + attr
    }else if(attr.substr(0,2) == '$$' && $B.aliased_names[attr.substr(2)]){
        attr = attr.substr(2)
    }
    else if(attr=='__class__'){
        // Setting the attribute __class__ : value is the factory function,
        // we must set __class__ to the class dictionary
        obj.__class__ = value.$dict;
        return None
    }else if(attr=='__dict__'){
        // set attribute __dict__
        // remove previous attributes
        if(!value.__class__===_b_.dict.$dict){
            throw _b_.TypeError("__dict__ must be set to a dictionary, " +
                "not a '"+value.__class__.$dict.__name+"'")
        }
        for(var attr in obj){
            if(attr !== "__class__"){delete obj[attr]}
        }
        // set them
        for(var attr in value.$string_dict){
            obj[attr] = value.$string_dict[attr]
        }
        return None
    }

    if(obj.__class__===$B.$factory){
        // Setting attribute of a class means updating the class
        // dictionary, not the class factory function
        obj.$dict[attr]=value;return None
    }

    var res = obj[attr],
        klass = obj.__class__ || $B.get_class(obj)
    if(res===undefined && klass){
        res = klass[attr]
        if(res===undefined){
            var mro = klass.__mro__,
                _len = mro.length
            for(var i=0;i<_len;i++){
                res = mro[i][attr]
                if(res!==undefined) break
            }
        }
    }

    if(res!==undefined){
        // descriptor protocol : if obj has attribute attr and this attribute
        // has a method __set__(), use it
        if(res.__set__!==undefined){
            res.__set__(res, obj, value); return None
        }
        var rcls = res.__class__, __set1__
        if(rcls!==undefined){
            var __set1__ = rcls.__set__
            if(__set1__===undefined){
                var mro = rcls.__mro__
                for(var i=0, _len=mro.length;i<_len;i++){
                    __set1__ = mro[i].__set__
                    if(__set1__){
                        break
                    }
                }
            }
        }
        if(__set1__!==undefined){
            var __set__ = getattr(res,'__set__',null)
            if(__set__ && (typeof __set__=='function')) {
                __set__.apply(res,[obj,value])
                return None
            }
        }else if(klass && klass.$descriptors !== undefined &&
            klass[attr] !== undefined){
            var setter = klass[attr].setter
            if(typeof setter == 'function'){
                setter(obj, value)
                return None
            }else{
                throw _b_.AttributeError('readonly attribute')
            }
        }
    }

    // Use __slots__ if defined
    if(klass && klass.$slots){
        // "When inheriting from a class without __slots__ (...)
        // a __slots__ definition in the subclass is meaningless."
        var has_slots = true,
            slots = klass.$slots,
            parent
        for(var i=0;i<klass.__mro__.length - 1;i++){
            parent = klass.__mro__[i]
            if(parent.$slots===undefined){has_slots=false;break}
            for(var k in parent.$slots){slots[k] = true}
        }
        if(has_slots && slots[attr] === undefined){
            throw _b_.AttributeError("'"+klass.__name__+
                "' object has no attribute '"+attr+"'")
        }
    }

    // Search the __setattr__ method
    var _setattr=false
    if(klass!==undefined){
        _setattr = klass.__setattr__
        if(_setattr===undefined){
            var mro = klass.__mro__
            for(var i=0, _len=mro.length;i<_len;i++){
                _setattr = mro[i].__setattr__
                if(_setattr){break}
            }
        }
    }

    if(!_setattr){obj[attr]=value}else{_setattr(obj,attr,value)}
    return None
}

function sorted () {
    var $=$B.args('sorted',1,{iterable:null},['iterable'],
        arguments,{},null,'kw')
    var _list = _b_.list(iter($.iterable)),
        args = [_list]
    for(var i=1;i<arguments.length;i++){args.push(arguments[i])}
    _b_.list.$dict.sort.apply(null,args)
    return _list
}

// staticmethod() built in function
var $StaticmethodDict = {__class__:$B.$type,__name__:'staticmethod'}
$StaticmethodDict.__mro__ = [$ObjectDict]

function staticmethod(func) {
    func.$type = 'staticmethod'
    return func
}
staticmethod.__class__=$B.$factory
staticmethod.$dict = $StaticmethodDict
$StaticmethodDict.$factory = staticmethod

// str() defined in py_string.js

function sum(iterable,start){
    var $ = $B.args('sum', 2, {iterable:null, start:null},
        ['iterable', 'start'], arguments, {start: 0}, null, null),
        iterable = $.iterable, start=$.start
    if(start===undefined) {
      start=0
    } else {
      if(typeof start === 'str') {
        throw _b_.TypeError("TypeError: sum() can't sum strings [use ''.join(seq) instead]")
      }

      if (_b_.isinstance(start, _b_.bytes)) {
         throw _b_.TypeError("TypeError: sum() can't sum bytes [use b''.join(seq) instead]")
      }
    }

    var res = start,
        iterable = iter(iterable),
        ce = $B.current_exception
    while(1){
        try{
            var _item = next(iterable)
            res = getattr(res,'__add__')(_item)
        }catch(err){
           if(err.__name__==='StopIteration'){
               $B.current_exception = ce
               break
           }else{throw err}
        }
    }
    return res
}

// super() built in function
var $SuperDict = {__class__:$B.$type,__name__:'super'}

$SuperDict.__getattribute__ = function(self,attr){

    var mro = self.__thisclass__.$dict.__mro__,
        res
    for(var i=0;i<mro.length;i++){ // ignore the class where super() is defined
        res = mro[i][attr]
        if(res!==undefined){
            // if super() is called with a second argument, the result is bound
            if(res.__class__===$PropertyDict){
                return res.__get__(res, self.__self_class__)
            }
            if(self.__self_class__!==None){
                if(mro[i]===_b_.object.$dict){
                    var klass = self.__self_class__.__class__
                    if(klass!==$B.$type){
                        if(klass.__mro__[0]===klass){console.log('anomalie', klass)}
                        var start = -1,
                            mro2 = [klass].concat(klass.__mro__)
                        for(var j=0;j<mro2.length;j++){
                            if(mro2[j]===self.__thisclass__.$dict){
                                start=j+1
                                break
                            }
                        }
                        if(start>-1){
                            for(var j=start;j<mro2.length;j++){
                                var res1 = mro2[j][attr]
                                if(res1!==undefined){ res = res1; break}
                            }
                        }
                    }
                }
                var _args = [self.__self_class__]
                if(attr=='__new__'){_args=[]}
                var method = (function(initial_args){
                    return function(){
                        // make a local copy of initial args
                        var local_args = initial_args.slice()
                        var pos=initial_args.length
                        for(var i=0;i<arguments.length;i++){
                            local_args[pos++]=arguments[i]
                        }
                        var x = res.apply(null,local_args)
                        if(x===undefined) return None
                        return x
                    }})(_args)
                method.__class__ = {
                    __class__:$B.$type,
                    __name__:'method',
                    __mro__:[$ObjectDict]
                }
                method.__func__ = res
                method.__self__ = self
                return method
            }
            return res
        }
    }
    if(attr=="__repr__" || attr=="__str__"){
        return function(){return $SuperDict[attr](self)}
    }

    throw _b_.AttributeError("object 'super' has no attribute '"+attr+"'")
}

$SuperDict.__mro__ = [$ObjectDict]

$SuperDict.__repr__=$SuperDict.__str__=function(self){
    var res = "<super: <class '"+self.__thisclass__.$dict.__name__+"'"
    if(self.__self_class__!==undefined){
        res += ', <'+self.__self_class__.__class__.__name__+' object>'
    }
    return res+'>'
}

function $$super(_type1,_type2){
    return {__class__:$SuperDict,
        __thisclass__:_type1,
        __self_class__:(_type2 || None)
    }
}
$$super.$dict = $SuperDict
$$super.__class__ = $B.$factory
$SuperDict.$factory = $$super
$$super.$is_func = true

function vars(){
    var def = {},
        $ = $B.args('vars', 1, {obj:null}, ['obj'], arguments, {obj: def},
        null, null)
    if($.obj===def){
        return _b_.locals()
    }else{
        try{return getattr($.obj, '__dict__')}
        catch(err){
            if(err.__class__===_b_.AttributeError.$dict){
                throw _b_.TypeError("vars() argument must have __dict__ attribute")
            }
            throw err
        }
    }
}

var $Reader = {__class__:$B.$type,__name__:'reader'}

$Reader.__enter__ = function(self){return self}

$Reader.__exit__ = function(self){return false}

$Reader.__iter__ = function(self){return iter(self.$lines)}

$Reader.__len__ = function(self){return self.lines.length}

$Reader.__mro__ = [$ObjectDict]

$Reader.close = function(self){self.closed = true}

$Reader.read = function(self,nb){
    if(self.closed===true) throw _b_.ValueError('I/O operation on closed file')
    if(nb===undefined) return self.$content

    self.$counter+=nb
    if(self.$bin){
        var res = self.$content.source.slice(self.$counter-nb, self.$counter)
        return _b_.bytes(res)
    }
    return self.$content.substr(self.$counter-nb,nb)
}

$Reader.readable = function(self){return true}

$Reader.readline = function(self,limit){
    // set line counter
    self.$lc = self.$lc === undefined ? -1 : self.$lc

    if(self.closed===true) throw _b_.ValueError('I/O operation on closed file')

    if(self.$lc==self.$lines.length-1){
        return self.$bin ? _b_.bytes() : ''
    }
    self.$lc++
    var res = self.$lines[self.$lc]
    self.$counter += (self.$bin ? res.source.length : res.length)
    return res
}

$Reader.readlines = function(self,hint){
    if(self.closed===true) throw _b_.ValueError('I/O operation on closed file')
    self.$lc = self.$lc === undefined ? -1 : self.$lc
    return self.$lines.slice(self.$lc+1)
}

$Reader.seek = function(self,offset,whence){
    if(self.closed===True) throw _b_.ValueError('I/O operation on closed file')
    if(whence===undefined) whence=0
    if(whence===0){self.$counter = offset}
    else if(whence===1){self.$counter += offset}
    else if(whence===2){self.$counter = self.$content.length+offset}
}

$Reader.seekable = function(self){return true}

$Reader.tell = function(self){return self.$counter}

$Reader.writable = function(self){return false}

var $BufferedReader = {__class__:$B.$type,__name__:'_io.BufferedReader'}

$BufferedReader.__mro__ = [$Reader,$ObjectDict]

var $TextIOWrapper = {__class__:$B.$type,__name__:'_io.TextIOWrapper'}

$TextIOWrapper.__mro__ = [$Reader,$ObjectDict]

function $url_open(){
    // first argument is file : can be a string, or an instance of a DOM File object
    // other arguments :
    // - mode can be 'r' (text, default) or 'rb' (binary)
    // - encoding if mode is 'rb'
    //var mode = 'r',encoding='utf-8'
    var $ns=$B.args('open',3,{file:null,mode:null,encoding:null},
        ['file','mode','encoding'],arguments,{mode:'r',encoding:'utf-8'},
        'args','kw'),
        $res
    for(var attr in $ns){eval('var '+attr+'=$ns["'+attr+'"]')}
    if(args.length>0) var mode=args[0]
    if(args.length>1) var encoding=args[1]
    var is_binary = mode.search('b')>-1
    if(isinstance(file,$B.JSObject)) return new $B.$OpenFile(file.js,mode,encoding)
    if(isinstance(file,_b_.str)){
        // read the file content and return an object with file object methods
        var req=new XMLHttpRequest();
        req.onreadystatechange = function(){
            try {
                var status = this.status
                if(status===404){
                    $res = _b_.IOError('File '+file+' not found')
                }else if(status!==200){
                    $res = _b_.IOError('Could not open file '+file+' : status '+status)
                }else{
                    $res = this.responseText
                    if(is_binary){
                        $res=_b_.str.$dict.encode($res, 'utf-8')
                    }
                }
            } catch (err) {
                $res = _b_.IOError('Could not open file '+file+' : error '+err)
            }
        }
        // add fake query string to avoid caching
        var fake_qs = '?foo='+(new Date().getTime())
        req.open('GET',file+fake_qs,false)
        if(is_binary){
            req.overrideMimeType('text/plain; charset=utf-8');
        }
        req.send()
        if($res.constructor===Error) throw $res

        if(is_binary){
            var lf = _b_.bytes('\n', 'ascii'),
                lines = _b_.bytes.$dict.split($res, lf)
            for(var i=0;i<lines.length-1;i++){lines[i].source.push(10)}
        }else{
            var lines = $res.split('\n')
            for(var i=0;i<lines.length-1;i++){lines[i]+='\n'}
        }

        // return the file-like object
        var res = {$content:$res,$counter:0,$lines:lines,$bin:is_binary,
            closed:False,encoding:encoding,mode:mode,name:file
        }
        res.__class__ = is_binary ? $BufferedReader : $TextIOWrapper

        return res
    }
}

var $ZipDict = {__class__:$B.$type,__name__:'zip'}

var $zip_iterator = $B.$iterator_class('zip_iterator')
$ZipDict.__iter__ = function(self){
    // issue #317 : iterator is not reset at each call to zip()
    return self.$iterator = self.$iterator ||
        $B.$iterator(self.items,$zip_iterator)
}

$ZipDict.__mro__ = [$ObjectDict]

function zip(){
    var res = {__class__:$ZipDict,items:[]}
    if(arguments.length==0) return res
    var $ns=$B.args('zip',0,{},[],arguments,{},'args','kw')
    var _args = $ns['args']
    var args = [], pos=0
    for(var i=0;i<_args.length;i++){args[pos++]=iter(_args[i])}
    var rank=0,
        items=[],
        ce = $B.current_exception
    while(1){
        var line=[],flag=true, pos=0
        for(var i=0;i<args.length;i++){
            try{
                line[pos++]=next(args[i])
            }catch(err){
                if(err.__name__==='StopIteration'){
                    flag=false
                    break
                }else{throw err}
            }
        }
        if(!flag) break
        items[rank++]=_b_.tuple(line)
    }
    $B.current_exception = ce
    res.items = items
    return res
}
zip.__class__=$B.$factory
zip.$dict = $ZipDict
$ZipDict.$factory = zip

// built-in constants : True, False, None

function no_set_attr(klass, attr){
    if(klass[attr]!==undefined){
        throw _b_.AttributeError("'"+klass.__name__+"' object attribute '"+
            attr+"' is read-only")
    }else{
        throw _b_.AttributeError("'"+klass.__name__+
            "' object has no attribute '"+attr+"'")
    }
}

var $BoolDict = $B.$BoolDict = {__class__:$B.$type,
    __dir__:$ObjectDict.__dir__,
    __name__:'bool'
    //$native:true
}
bool.__class__ = $B.$factory
bool.$dict = $BoolDict

$BoolDict.$factory = bool

// True and False are the same as Javascript true and false

var True = true
var False = false

var $EllipsisDict = {__class__:$B.$type,
    __name__:'ellipsis'
}
$EllipsisDict.__mro__ = [$ObjectDict]

var Ellipsis = {
    $dict: $EllipsisDict,
    __bool__ : function(){return True},
    __class__ : $EllipsisDict
}
$EllipsisDict.$factory = Ellipsis

for(var $key in $B.$comps){ // Ellipsis is not orderable with any type
    switch($B.$comps[$key]) {
      case 'ge':
      case 'gt':
      case 'le':
      case 'lt':
        Ellipsis['__'+$B.$comps[$key]+'__']=(function(k){
            return function(other){
            throw _b_.TypeError("unorderable types: ellipsis() "+k+" "+
                $B.get_class(other).__name__)}
        })($key)
    }
}

for(var $func in Ellipsis){
    if(typeof Ellipsis[$func]==='function'){
        Ellipsis[$func].__str__ = (function(f){
            return function(){return "<method-wrapper "+f+" of Ellipsis object>"}
        })($func)
    }
}


// add attributes to native Function
var $FunctionCodeDict = {__class__:$B.$type,__name__:'function code'}
$FunctionCodeDict.__mro__ = [$ObjectDict]
$FunctionCodeDict.$factory = {__class__:$B.$factory, $dict:$FunctionCodeDict}

var $FunctionGlobalsDict = {__class:$B.$type,__name__:'function globals'}
$FunctionGlobalsDict.__mro__ = [$ObjectDict]
$FunctionGlobalsDict.$factory = {__class__:$B.$factory, $dict:$FunctionGlobalsDict}

var $FunctionDict = $B.$FunctionDict = {
    __class__:$B.$type,
    __code__:{__class__:$FunctionCodeDict,__name__:'function code'},
    __globals__:{__class__:$FunctionGlobalsDict,__name__:'function globals'},
    __name__:'function'
}

$FunctionDict.__dir__ = function(self){
    var infos = self.$infos || {},
        attrs = self.$attrs || {}

    return Object.keys(infos).concat(Object.keys(attrs))
}

$FunctionDict.__eq__ = function(self, other){
    return self === other
}

$FunctionDict.__getattribute__ = function(self, attr){
    // Internal attributes __name__, __module__, __doc__ etc.
    // are stored in self.$infos
    if(self.$infos && self.$infos[attr]!==undefined){
        if(attr=='__code__'){
            var res = {__class__:$B.$CodeDict}
            for(var attr in self.$infos.__code__){
                res[attr]=self.$infos.__code__[attr]
            }
            return res
        }else if(attr=='__annotations__'){
            // annotations is stored as a Javascript object
            return $B.obj_dict(self.$infos[attr])
        }else{
            return self.$infos[attr]
        }
    }else if(self.$attrs && self.$attrs[attr] !== undefined){
        return self.$attrs[attr]
    }else{
        return _b_.object.$dict.__getattribute__(self, attr)
    }
}

$FunctionDict.__repr__=$FunctionDict.__str__ = function(self){
    return '<function '+self.$infos.__qualname__+'>'
}

$FunctionDict.__mro__ = [$ObjectDict]

$FunctionDict.__setattr__ = function(self, attr, value){
    if(self.$infos[attr]!==undefined){self.$infos[attr] = value}
    else{self.$attrs = self.$attrs || {}; self.$attrs[attr] = value}
}

var $Function = function(){}
$Function.__class__ = $B.$factory
$FunctionDict.$factory = $Function
$Function.$dict = $FunctionDict


_b_.__BRYTHON__ = __BRYTHON__

var builtin_funcs = ['abs', 'all', 'any', 'ascii', 'bin', 'bool', 'bytearray',
'bytes', 'callable', 'chr', 'classmethod', 'compile', 'complex', 'delattr',
'dict', 'dir', 'divmod', 'enumerate', 'eval', 'exec', 'exit',
'filter', 'float', 'format', 'frozenset', 'getattr', 'globals', 'hasattr', 'hash',
'help', 'hex', 'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len',
'list', 'locals', 'map', 'max', 'memoryview', 'min', 'next', 'object',
'oct', 'open', 'ord', 'pow', 'print', 'property', 'quit', 'range', 'repr',
'reversed', 'round', 'set', 'setattr', 'slice', 'sorted', 'staticmethod', 'str',
'sum','$$super', 'tuple', 'type', 'vars', 'zip']

for(var i=0;i<builtin_funcs.length;i++){
    var name = builtin_funcs[i]
    if(name=='open'){name1 = '$url_open'}
    if(name=='super'){name = '$$super'}
    if(name=='eval'){name = '$eval'}
    $B.builtin_funcs[name]=true
}
$B.builtin_funcs['$eval'] = true

var other_builtins = [ 'Ellipsis', 'False',  'None', 'True',
'__debug__', '__import__',
'copyright', 'credits', 'license', 'NotImplemented', 'type']

var builtin_names = builtin_funcs.concat(other_builtins)

for(var i=0;i<builtin_names.length;i++){
    var name = builtin_names[i]
    var orig_name = name
    var name1 = name
    if(name=='open'){name1 = '$url_open'}
    if(name=='super'){name = '$$super'}
    if(name=='eval'){name = name1 = '$$eval'}
    if(name=='print'){name1 = '$print'}
    $B.bound['__builtins__'][name] = true
    try{
        _b_[name] = eval(name1)
        if($B.builtin_funcs[name]!==undefined){
            //console.log(name+' is builtin func')
            if(_b_[name].__repr__===undefined){
                //console.log('set repr for '+name)
                _b_[name].__repr__ = _b_[name].__str__ = (function(x){
                    return function(){return '<built-in function '+x+'>'}
                })(orig_name)
            }
            // used by inspect module
            _b_[name].__module__ = 'builtins'
            _b_[name].__name__ = name
            _b_[name].__defaults__= _b_[name].__defaults__ || []
            _b_[name].__kwdefaults__= _b_[name].__kwdefaults__ || {}
            _b_[name].__annotations__= _b_[name].__annotations__ || {}
        }
        _b_[name].__doc__=_b_[name].__doc__ || ''

    }
    catch(err){}
}

_b_['$$eval']=$eval

_b_['open']=$url_open
_b_['print']=$print
_b_['$$super']=$$super


})(__BRYTHON__)
