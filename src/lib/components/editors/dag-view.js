class $PanicError extends Error {}
function $panic() {
  throw new $PanicError();
}
function $make_array_len_and_init(a, b) {
  const arr = new Array(a);
  for (let i = 0; i < a; i++) {
    arr[i] = b;
  }
  return arr;
}
const moonbitlang$core$builtin$$JSArray$push = (arr, val) => { arr.push(val); };
const moonbitlang$core$builtin$$JSArray$pop = (arr) => arr.pop();
const $64$moonbitlang$47$core$47$priority_queue$46$Node$Nil$0$ = { $tag: 0 };
function $64$moonbitlang$47$core$47$priority_queue$46$Node$Cons$0$(param0, param1, param2) {
  this._0 = param0;
  this._1 = param1;
  this._2 = param2;
}
$64$moonbitlang$47$core$47$priority_queue$46$Node$Cons$0$.prototype.$tag = 1;
function $compare_int(a, b) {
  return (a >= b) - (a <= b);
}
function moonbitlang$core$builtin$$rotl(x, r) {
  return x << r | (x >>> (32 - r | 0) | 0);
}
function moonbitlang$core$builtin$$op_gt$0$(self_, other) {
  return moonbitlang$core$builtin$$Compare$compare$0$(self_, other) > 0;
}
function moonbitlang$core$builtin$$op_notequal$1$(x, y) {
  return !moonbitlang$core$builtin$$IterResult$op_equal(x, y);
}
function moonbitlang$core$array$$Array$op_get$2$(self, index) {
  const len = self.length;
  return index >= 0 && index < len ? self[index] : $panic();
}
function moonbitlang$core$array$$Array$op_get$3$(self, index) {
  const len = self.length;
  return index >= 0 && index < len ? self[index] : $panic();
}
function moonbitlang$core$array$$Array$op_get$4$(self, index) {
  const len = self.length;
  return index >= 0 && index < len ? self[index] : $panic();
}
function moonbitlang$core$array$$Array$op_get$5$(self, index) {
  const len = self.length;
  return index >= 0 && index < len ? self[index] : $panic();
}
function moonbitlang$core$array$$Array$op_get$6$(self, index) {
  const len = self.length;
  return index >= 0 && index < len ? self[index] : $panic();
}
function moonbitlang$core$array$$FixedArray$unsafe_blit$7$(dst, dst_offset, src, src_offset, len) {
  if (dst === src && dst_offset < src_offset) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < len) {
        dst[dst_offset + i | 0] = src[src_offset + i | 0];
        _tmp = i + 1 | 0;
        continue;
      } else {
        return;
      }
    }
  } else {
    let _tmp = len - 1 | 0;
    while (true) {
      const i = _tmp;
      if (i >= 0) {
        dst[dst_offset + i | 0] = src[src_offset + i | 0];
        _tmp = i - 1 | 0;
        continue;
      } else {
        return;
      }
    }
  }
}
function moonbitlang$core$array$$Array$op_set$6$(self, index, value) {
  const len = self.length;
  if (index >= 0 && index < len) {
    self[index] = value;
    return;
  } else {
    $panic();
    return;
  }
}
function moonbitlang$core$array$$Array$make$3$(len, elem) {
  const arr = new Array(len);
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < len) {
      arr[i] = elem;
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function moonbitlang$core$array$$Array$make$6$(len, elem) {
  const arr = new Array(len);
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < len) {
      arr[i] = elem;
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function moonbitlang$core$builtin$$IterResult$op_equal(_self, _other) {
  if (_self === 0) {
    if (_other === 0) {
      return true;
    } else {
      return false;
    }
  } else {
    if (_other === 1) {
      return true;
    } else {
      return false;
    }
  }
}
function moonbitlang$core$builtin$$Hasher$combine$6$(self, value) {
  moonbitlang$core$builtin$$Hash$hash_combine$6$(value, self);
}
function moonbitlang$core$builtin$$power_2_above(x, n) {
  let _tmp = x;
  while (true) {
    const i = _tmp;
    if (i >= n) {
      return i;
    }
    const next = i << 1;
    if (next < 0) {
      return i;
    }
    _tmp = next;
    continue;
  }
}
function moonbitlang$core$builtin$$calc_grow_threshold(capacity) {
  return (Math.imul(capacity, 13) | 0) / 16 | 0;
}
function moonbitlang$core$builtin$$Map$new$8$(capacity) {
  const capacity$2 = moonbitlang$core$builtin$$power_2_above(8, capacity);
  return { entries: $make_array_len_and_init(capacity$2, undefined), list: $make_array_len_and_init(capacity$2, { prev: undefined, next: undefined }), size: 0, capacity: capacity$2, capacity_mask: capacity$2 - 1 | 0, growAt: moonbitlang$core$builtin$$calc_grow_threshold(capacity$2), head: undefined, tail: undefined };
}
function moonbitlang$core$builtin$$Map$new$46$capacity$46$default$8$() {
  return 8;
}
function moonbitlang$core$builtin$$Map$add_entry_to_tail$8$(self, entry) {
  const _bind = self.tail;
  if (_bind === undefined) {
    self.head = entry;
    self.tail = entry;
    return;
  } else {
    const _Some = _bind;
    const _x = _Some;
    self.list[_x.idx].next = entry;
    self.list[entry.idx].prev = _x;
    self.tail = entry;
    return;
  }
}
function moonbitlang$core$builtin$$Map$set$8$(self, key, value) {
  if (self.size >= self.growAt) {
    moonbitlang$core$builtin$$Map$grow$8$(self);
  }
  const hash = moonbitlang$core$builtin$$Hash$hash$9$(key);
  const insert_entry = { idx: -1, psl: 0, hash: hash, key: key, value: value };
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  let _tmp$3 = insert_entry;
  let _tmp$4 = { prev: undefined, next: undefined };
  while (true) {
    const _param = _tmp;
    const _param$2 = _tmp$2;
    const _param$3 = _tmp$3;
    const _param$4 = _tmp$4;
    const _bind = self.entries[_param$2];
    if (_bind === undefined) {
      self.entries[_param$2] = _param$3;
      self.list[_param$2] = _param$4;
      _param$3.idx = _param$2;
      moonbitlang$core$builtin$$Map$add_entry_to_tail$8$(self, insert_entry);
      self.size = self.size + 1 | 0;
      return;
    } else {
      const _Some = _bind;
      const _x = _Some;
      const curr_node = self.list[_x.idx];
      if (_x.hash === _param$3.hash && _x.key === _param$3.key) {
        _x.value = _param$3.value;
        break;
      }
      if (_param$3.psl > _x.psl) {
        self.entries[_param$2] = _param$3;
        self.list[_param$2] = _param$4;
        _param$3.idx = _param$2;
        _x.psl = _x.psl + 1 | 0;
        const _tmp$5 = _param + 1 | 0;
        const _tmp$6 = _param$2 + 1 & self.capacity_mask;
        _tmp = _tmp$5;
        _tmp$2 = _tmp$6;
        _tmp$3 = _x;
        _tmp$4 = curr_node;
        continue;
      } else {
        _param$3.psl = _param$3.psl + 1 | 0;
        const _tmp$5 = _param + 1 | 0;
        const _tmp$6 = _param$2 + 1 & self.capacity_mask;
        _tmp = _tmp$5;
        _tmp$2 = _tmp$6;
        continue;
      }
    }
  }
}
function moonbitlang$core$builtin$$Map$grow$8$(self) {
  const old_head = self.head;
  const old_list = self.list;
  const new_capacity = self.capacity << 1;
  self.entries = $make_array_len_and_init(new_capacity, undefined);
  self.list = $make_array_len_and_init(new_capacity, { prev: undefined, next: undefined });
  self.capacity = new_capacity;
  self.capacity_mask = new_capacity - 1 | 0;
  self.growAt = moonbitlang$core$builtin$$calc_grow_threshold(self.capacity);
  self.size = 0;
  self.head = undefined;
  self.tail = undefined;
  let _tmp = old_head;
  while (true) {
    const _param = _tmp;
    if (_param === undefined) {
      return;
    } else {
      const _Some = _param;
      const _x = _Some;
      const _x$2 = _x.idx;
      const _x$3 = _x.key;
      const _x$4 = _x.value;
      moonbitlang$core$builtin$$Map$set$8$(self, _x$3, _x$4);
      _tmp = old_list[_x$2].next;
      continue;
    }
  }
}
function moonbitlang$core$builtin$$Map$get$8$(self, key) {
  const hash = moonbitlang$core$builtin$$Hash$hash$9$(key);
  let _tmp = 0;
  let _tmp$2 = hash & self.capacity_mask;
  while (true) {
    const i = _tmp;
    const idx = _tmp$2;
    const _bind = self.entries[idx];
    if (_bind === undefined) {
      return undefined;
    } else {
      const _Some = _bind;
      const _x = _Some;
      if (_x.hash === hash && _x.key === key) {
        return _x.value;
      }
      if (i > _x.psl) {
        return undefined;
      }
      const _tmp$3 = i + 1 | 0;
      const _tmp$4 = idx + 1 & self.capacity_mask;
      _tmp = _tmp$3;
      _tmp$2 = _tmp$4;
      continue;
    }
  }
}
function moonbitlang$core$builtin$$Map$contains$8$(self, key) {
  const _bind = moonbitlang$core$builtin$$Map$get$8$(self, key);
  return !(_bind === undefined);
}
function moonbitlang$core$option$$Option$unwrap$3$(self) {
  if (self === undefined) {
    return $panic();
  } else {
    const _Some = self;
    const _x = _Some;
    return _x;
  }
}
function moonbitlang$core$option$$Option$unwrap$0$(self) {
  if (self === undefined) {
    return $panic();
  } else {
    const _Some = self;
    const _x = _Some;
    return _x;
  }
}
function moonbitlang$core$option$$Option$unwrap$10$(self) {
  if (self === undefined) {
    return $panic();
  } else {
    const _Some = self;
    const _x = _Some;
    return _x;
  }
}
function moonbitlang$core$builtin$$Iter$new$2$(f) {
  return f;
}
function moonbitlang$core$builtin$$Iter$new$6$(f) {
  return f;
}
function moonbitlang$core$builtin$$Iter$new$5$(f) {
  return f;
}
function moonbitlang$core$builtin$$Iter$new$3$(f) {
  return f;
}
function moonbitlang$core$builtin$$Iter$new$4$(f) {
  return f;
}
function moonbitlang$core$builtin$$Iter2$new$11$(f) {
  return f;
}
function moonbitlang$core$array$$Array$push$6$(self, value) {
  moonbitlang$core$builtin$$JSArray$push(self, value);
}
function moonbitlang$core$array$$Array$push$4$(self, value) {
  moonbitlang$core$builtin$$JSArray$push(self, value);
}
function moonbitlang$core$array$$Array$push$5$(self, value) {
  moonbitlang$core$builtin$$JSArray$push(self, value);
}
function moonbitlang$core$array$$Array$push$3$(self, value) {
  moonbitlang$core$builtin$$JSArray$push(self, value);
}
function moonbitlang$core$array$$Array$new$6$(capacity) {
  return [];
}
function moonbitlang$core$array$$Array$new$46$capacity$46$default$6$() {
  return 0;
}
function moonbitlang$core$array$$Array$unsafe_pop$6$(self) {
  return moonbitlang$core$builtin$$JSArray$pop(self);
}
function moonbitlang$core$array$$Array$pop$6$(self) {
  if (self.length === 0) {
    return undefined;
  } else {
    const v = moonbitlang$core$array$$Array$unsafe_pop$6$(self);
    return v;
  }
}
function moonbitlang$core$builtin$$Hasher$new(seed) {
  return { acc: seed + 374761393 | 0 };
}
function moonbitlang$core$builtin$$Hasher$new$46$seed$46$default() {
  return 0;
}
function moonbitlang$core$builtin$$Hasher$consume4(self, input) {
  self.acc = Math.imul(moonbitlang$core$builtin$$rotl(self.acc + (Math.imul(input, -1028477379) | 0) | 0, 17), 668265263) | 0;
}
function moonbitlang$core$builtin$$Hasher$combine_int(self, value) {
  self.acc = self.acc + 4 | 0;
  moonbitlang$core$builtin$$Hasher$consume4(self, value);
}
function moonbitlang$core$builtin$$Hasher$combine_string(self, value) {
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < value.length) {
      moonbitlang$core$builtin$$Hasher$combine_int(self, value.charCodeAt(i));
      _tmp = i + 1 | 0;
      continue;
    } else {
      return;
    }
  }
}
function moonbitlang$core$builtin$$Hasher$avalanche(self) {
  let acc = self.acc;
  acc = acc ^ (acc >>> 15 | 0);
  acc = Math.imul(acc, -2048144777) | 0;
  acc = acc ^ (acc >>> 13 | 0);
  acc = Math.imul(acc, -1028477379) | 0;
  acc = acc ^ (acc >>> 16 | 0);
  return acc;
}
function moonbitlang$core$builtin$$Hasher$finalize(self) {
  return moonbitlang$core$builtin$$Hasher$avalanche(self);
}
function moonbitlang$core$builtin$$Hash$hash_combine$6$(self, hasher) {
  moonbitlang$core$builtin$$Hasher$combine_string(hasher, self);
}
function moonbitlang$core$array$$Array$map$12$(self, f) {
  if (self.length === 0) {
    return [];
  }
  const arr = new Array(self.length);
  const _len = self.length;
  let _tmp = 0;
  while (true) {
    const _i = _tmp;
    if (_i < _len) {
      const v = moonbitlang$core$array$$Array$op_get$3$(self, _i);
      arr[_i] = f(v);
      _tmp = _i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function moonbitlang$core$array$$Array$map$13$(self, f) {
  if (self.length === 0) {
    return [];
  }
  const arr = new Array(self.length);
  const _len = self.length;
  let _tmp = 0;
  while (true) {
    const _i = _tmp;
    if (_i < _len) {
      const v = moonbitlang$core$array$$Array$op_get$5$(self, _i);
      arr[_i] = f(v);
      _tmp = _i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function moonbitlang$core$array$$Array$map$14$(self, f) {
  if (self.length === 0) {
    return [];
  }
  const arr = new Array(self.length);
  const _len = self.length;
  let _tmp = 0;
  while (true) {
    const _i = _tmp;
    if (_i < _len) {
      const v = moonbitlang$core$array$$Array$op_get$5$(self, _i);
      arr[_i] = f(v);
      _tmp = _i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function moonbitlang$core$array$$Array$unsafe_blit$6$(dst, dst_offset, src, src_offset, len) {
  moonbitlang$core$array$$FixedArray$unsafe_blit$7$(dst, dst_offset, src, src_offset, len);
}
function moonbitlang$core$array$$Array$iter$2$(self) {
  return moonbitlang$core$builtin$$Iter$new$2$((yield_) => {
    const _len = self.length;
    let _tmp = 0;
    while (true) {
      const _i = _tmp;
      if (_i < _len) {
        const v = moonbitlang$core$array$$Array$op_get$2$(self, _i);
        const _bind = yield_(v);
        if (_bind === 1) {
        } else {
          return _bind;
        }
        _tmp = _i + 1 | 0;
        continue;
      } else {
        return 1;
      }
    }
  });
}
function moonbitlang$core$array$$Array$iter$4$(self) {
  return moonbitlang$core$builtin$$Iter$new$4$((yield_) => {
    const _len = self.length;
    let _tmp = 0;
    while (true) {
      const _i = _tmp;
      if (_i < _len) {
        const v = moonbitlang$core$array$$Array$op_get$4$(self, _i);
        const _bind = yield_(v);
        if (_bind === 1) {
        } else {
          return _bind;
        }
        _tmp = _i + 1 | 0;
        continue;
      } else {
        return 1;
      }
    }
  });
}
function moonbitlang$core$array$$Array$iter$3$(self) {
  return moonbitlang$core$builtin$$Iter$new$3$((yield_) => {
    const _len = self.length;
    let _tmp = 0;
    while (true) {
      const _i = _tmp;
      if (_i < _len) {
        const v = moonbitlang$core$array$$Array$op_get$3$(self, _i);
        const _bind = yield_(v);
        if (_bind === 1) {
        } else {
          return _bind;
        }
        _tmp = _i + 1 | 0;
        continue;
      } else {
        return 1;
      }
    }
  });
}
function moonbitlang$core$array$$Array$iter$5$(self) {
  return moonbitlang$core$builtin$$Iter$new$5$((yield_) => {
    const _len = self.length;
    let _tmp = 0;
    while (true) {
      const _i = _tmp;
      if (_i < _len) {
        const v = moonbitlang$core$array$$Array$op_get$5$(self, _i);
        const _bind = yield_(v);
        if (_bind === 1) {
        } else {
          return _bind;
        }
        _tmp = _i + 1 | 0;
        continue;
      } else {
        return 1;
      }
    }
  });
}
function moonbitlang$core$array$$Array$iter$6$(self) {
  return moonbitlang$core$builtin$$Iter$new$6$((yield_) => {
    const _len = self.length;
    let _tmp = 0;
    while (true) {
      const _i = _tmp;
      if (_i < _len) {
        const v = moonbitlang$core$array$$Array$op_get$6$(self, _i);
        const _bind = yield_(v);
        if (_bind === 1) {
        } else {
          return _bind;
        }
        _tmp = _i + 1 | 0;
        continue;
      } else {
        return 1;
      }
    }
  });
}
function moonbitlang$core$builtin$$Hash$hash$9$(self) {
  const hasher = moonbitlang$core$builtin$$Hasher$new(moonbitlang$core$builtin$$Hasher$new$46$seed$46$default());
  moonbitlang$core$builtin$$Hasher$combine$6$(hasher, self);
  return moonbitlang$core$builtin$$Hasher$finalize(hasher);
}
function moonbitlang$core$array$$Array$filter$5$(self, f) {
  const arr = [];
  const _len = self.length;
  let _tmp = 0;
  while (true) {
    const _i = _tmp;
    if (_i < _len) {
      const v = moonbitlang$core$array$$Array$op_get$5$(self, _i);
      if (f(v)) {
        moonbitlang$core$array$$Array$push$5$(arr, v);
      }
      _tmp = _i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  return arr;
}
function moonbitlang$core$array$$Array$is_empty$6$(self) {
  return self.length === 0;
}
function moonbitlang$core$array$$Array$search$3$(self, value) {
  const _len = self.length;
  let _tmp = 0;
  while (true) {
    const _i = _tmp;
    if (_i < _len) {
      const v = moonbitlang$core$array$$Array$op_get$3$(self, _i);
      if (v === value) {
        return _i;
      }
      _tmp = _i + 1 | 0;
      continue;
    } else {
      return undefined;
    }
  }
}
function moonbitlang$core$array$$Array$search_by$5$(self, f) {
  const _len = self.length;
  let _tmp = 0;
  while (true) {
    const _i = _tmp;
    if (_i < _len) {
      const v = moonbitlang$core$array$$Array$op_get$5$(self, _i);
      if (f(v)) {
        return _i;
      }
      _tmp = _i + 1 | 0;
      continue;
    } else {
      return undefined;
    }
  }
}
function moonbitlang$core$array$$Array$search_by$3$(self, f) {
  const _len = self.length;
  let _tmp = 0;
  while (true) {
    const _i = _tmp;
    if (_i < _len) {
      const v = moonbitlang$core$array$$Array$op_get$3$(self, _i);
      if (f(v)) {
        return _i;
      }
      _tmp = _i + 1 | 0;
      continue;
    } else {
      return undefined;
    }
  }
}
function moonbitlang$core$array$$Array$iter2$5$(self) {
  return moonbitlang$core$builtin$$Iter2$new$11$((yield_) => {
    const _len = self.length;
    let _tmp = 0;
    while (true) {
      const _i = _tmp;
      if (_i < _len) {
        const v = moonbitlang$core$array$$Array$op_get$5$(self, _i);
        const _bind = yield_(_i, v);
        if (_bind === 1) {
        } else {
          return _bind;
        }
        _tmp = _i + 1 | 0;
        continue;
      } else {
        return 1;
      }
    }
  });
}
function moonbitlang$core$builtin$$Iter$run$3$(self, f) {
  return self(f);
}
function moonbitlang$core$builtin$$Iter$any$3$(self, f) {
  return moonbitlang$core$builtin$$op_notequal$1$(moonbitlang$core$builtin$$Iter$run$3$(self, (k) => f(k) ? 0 : 1), 1);
}
function moonbitlang$core$builtin$$Iter$collect$5$(self) {
  const result = [];
  self((_p) => {
    moonbitlang$core$array$$Array$push$5$(result, _p);
    return 1;
  });
  return result;
}
function moonbitlang$core$array$$Array$copy$6$(self) {
  const len = self.length;
  if (len === 0) {
    return [];
  } else {
    const arr = moonbitlang$core$array$$Array$make$6$(len, moonbitlang$core$array$$Array$op_get$6$(self, 0));
    moonbitlang$core$array$$Array$unsafe_blit$6$(arr, 0, self, 0, len);
    return arr;
  }
}
function moonbitlang$core$array$$Array$last$4$(self) {
  if (self.length === 0) {
    return undefined;
  } else {
    const _x = moonbitlang$core$array$$Array$op_get$4$(self, (self.length - 1 | 0) - 0 | 0);
    return _x;
  }
}
function moonbitlang$core$priority_queue$$T$new$0$() {
  return { len: 0, top: $64$moonbitlang$47$core$47$priority_queue$46$Node$Nil$0$ };
}
function moonbitlang$core$priority_queue$$meld$0$(x, y) {
  if (x.$tag === 0) {
    return y;
  } else {
    if (y.$tag === 0) {
      return x;
    } else {
      const _Cons = x;
      const _Cons$2 = y;
      if (moonbitlang$core$builtin$$op_gt$0$(_Cons._0, _Cons$2._0)) {
        _Cons$2._1 = _Cons._2;
        _Cons._2 = y;
        return x;
      } else {
        _Cons._1 = _Cons$2._2;
        _Cons$2._2 = x;
        return y;
      }
    }
  }
}
function moonbitlang$core$priority_queue$$T$push$0$(self, value) {
  self.top = moonbitlang$core$priority_queue$$meld$0$(self.top, new $64$moonbitlang$47$core$47$priority_queue$46$Node$Cons$0$(value, $64$moonbitlang$47$core$47$priority_queue$46$Node$Nil$0$, $64$moonbitlang$47$core$47$priority_queue$46$Node$Nil$0$));
  self.len = self.len + 1 | 0;
}
function moonbitlang$core$priority_queue$$merges$0$(x) {
  if (x.$tag === 0) {
    return $64$moonbitlang$47$core$47$priority_queue$46$Node$Nil$0$;
  } else {
    const _Cons = x;
    const _x = _Cons._1;
    if (_x.$tag === 0) {
      return x;
    } else {
      const _Cons$2 = _x;
      const _x$2 = _Cons$2._1;
      if (_x$2.$tag === 0) {
        return moonbitlang$core$priority_queue$$meld$0$(x, _x);
      } else {
        return moonbitlang$core$priority_queue$$meld$0$(moonbitlang$core$priority_queue$$merges$0$(_x$2), moonbitlang$core$priority_queue$$meld$0$(x, _x));
      }
    }
  }
}
function moonbitlang$core$priority_queue$$T$peek$0$(self) {
  const _bind = self.top;
  if (_bind.$tag === 0) {
    return undefined;
  } else {
    const _Cons = _bind;
    const _x = _Cons._0;
    return _x;
  }
}
function moonbitlang$core$priority_queue$$T$pop$0$(self) {
  const result = moonbitlang$core$priority_queue$$T$peek$0$(self);
  const _bind = self.top;
  let _tmp;
  if (_bind.$tag === 0) {
    _tmp = $64$moonbitlang$47$core$47$priority_queue$46$Node$Nil$0$;
  } else {
    const _Cons = _bind;
    const _x = _Cons._2;
    self.len = self.len - 1 | 0;
    _tmp = moonbitlang$core$priority_queue$$merges$0$(_x);
  }
  self.top = _tmp;
  return result;
}
function moonbitlang$core$priority_queue$$T$is_empty$0$(self) {
  return self.len === 0;
}
function moonbitlang$core$option$$Option$map$15$(self, f) {
  if (self === undefined) {
    return undefined;
  } else {
    const _Some = self;
    const _x = _Some;
    return f(_x);
  }
}
function moonbitlang$core$option$$Option$or$16$(self, default_) {
  if (self === undefined) {
    return default_;
  } else {
    const _Some = self;
    const _x = _Some;
    return _x;
  }
}
function moonbitlang$core$string$$String$compare(self, other) {
  const len = self.length;
  const _bind = $compare_int(len, other.length);
  if (_bind === 0) {
    let _tmp = 0;
    while (true) {
      const i = _tmp;
      if (i < len) {
        const order = $compare_int(self.charCodeAt(i), other.charCodeAt(i));
        if (order !== 0) {
          return order;
        }
        _tmp = i + 1 | 0;
        continue;
      } else {
        break;
      }
    }
    return 0;
  } else {
    return _bind;
  }
}
function moonbitlang$core$builtin$$Compare$compare$0$(a, b) {
  const ans = a.node.lamport - b.node.lamport | 0;
  return ans === 0 ? moonbitlang$core$string$$String$compare(a.node.id, b.node.id) : ans;
}
function zxch3n$dag$45$view$lib$$visualize(find, frontiers) {
  const queue = moonbitlang$core$priority_queue$$T$new$0$();
  const visited = moonbitlang$core$builtin$$Map$new$8$(moonbitlang$core$builtin$$Map$new$46$capacity$46$default$8$());
  const next_tid = { val: 0 };
  const _bind = moonbitlang$core$array$$Array$iter$6$(frontiers);
  _bind((id) => {
    const node = moonbitlang$core$option$$Option$unwrap$10$(find(id));
    moonbitlang$core$priority_queue$$T$push$0$(queue, { node: node, tid: next_tid.val });
    moonbitlang$core$builtin$$Map$set$8$(visited, node.id, next_tid.val);
    next_tid.val = next_tid.val + 1 | 0;
    return 1;
  });
  const ans = { rows: [] };
  while (true) {
    if (!moonbitlang$core$priority_queue$$T$is_empty$0$(queue)) {
      const top = moonbitlang$core$option$$Option$unwrap$0$(moonbitlang$core$priority_queue$$T$pop$0$(queue));
      const input = moonbitlang$core$option$$Option$or$16$(moonbitlang$core$option$$Option$map$15$(moonbitlang$core$array$$Array$last$4$(ans.rows), (x) => {
        const _bind$2 = moonbitlang$core$array$$Array$iter$5$(x.output);
        return moonbitlang$core$builtin$$Iter$collect$5$((_p) => _bind$2((_p$2) => {
          let dep_on_this = false;
          dep_on_this = false;
          const deps = moonbitlang$core$array$$Array$copy$6$(_p$2.deps);
          let _tmp = 0;
          while (true) {
            const i = _tmp;
            if (i < deps.length) {
              if (moonbitlang$core$array$$Array$op_get$6$(deps, i) === top.node.id) {
                dep_on_this = true;
                moonbitlang$core$array$$Array$op_set$6$(deps, i, moonbitlang$core$array$$Array$op_get$6$(deps, deps.length - 1 | 0));
                moonbitlang$core$array$$Array$pop$6$(deps);
                break;
              }
              _tmp = i + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          dep_on_this = dep_on_this || top.tid === _p$2.tid;
          return _p({ tid: _p$2.tid, deps: deps, dep_on_active: dep_on_this });
        }));
      }), []);
      const this_thread = { val: undefined };
      const output = moonbitlang$core$array$$Array$filter$5$(moonbitlang$core$array$$Array$map$14$(input, (x) => ({ tid: x.tid, deps: x.deps, dep_on_active: x.dep_on_active })), (x) => {
        if (x.tid === top.tid) {
          this_thread.val = x;
          return !moonbitlang$core$array$$Array$is_empty$6$(top.node.deps);
        }
        return !moonbitlang$core$array$$Array$is_empty$6$(x.deps);
      });
      const cur_tids = moonbitlang$core$array$$Array$map$13$(output, (x) => x.tid);
      if (!moonbitlang$core$builtin$$Iter$any$3$(moonbitlang$core$array$$Array$iter$3$(cur_tids), (x) => x === top.tid)) {
        moonbitlang$core$array$$Array$push$3$(cur_tids, top.tid);
      }
      const cur_index = moonbitlang$core$option$$Option$unwrap$3$(moonbitlang$core$array$$Array$search_by$3$(cur_tids, (x) => x === top.tid));
      if (top.node.deps.length > 0) {
        const node = moonbitlang$core$option$$Option$unwrap$10$(find(moonbitlang$core$array$$Array$op_get$6$(top.node.deps, 0)));
        if (!moonbitlang$core$builtin$$Map$contains$8$(visited, node.id)) {
          moonbitlang$core$priority_queue$$T$push$0$(queue, { node: node, tid: top.tid });
          moonbitlang$core$builtin$$Map$set$8$(visited, node.id, top.tid);
          const _bind$2 = this_thread.val;
          if (_bind$2 === undefined) {
            moonbitlang$core$array$$Array$push$5$(output, { tid: top.tid, deps: [node.id], dep_on_active: true });
          } else {
            const _Some = _bind$2;
            const _x = _Some;
            _x.deps = [node.id];
          }
        } else {
          const _bind$2 = this_thread.val;
          if (_bind$2 === undefined) {
            const target_tid = moonbitlang$core$option$$Option$unwrap$3$(moonbitlang$core$builtin$$Map$get$8$(visited, node.id));
            const _bind$3 = moonbitlang$core$array$$Array$search_by$5$(output, (x) => x.tid === target_tid);
            if (_bind$3 === undefined) {
            } else {
              const _Some = _bind$3;
              const _x = _Some;
              moonbitlang$core$array$$Array$op_get$5$(output, _x).dep_on_active = true;
            }
          } else {
            const _Some = _bind$2;
            const _x = _Some;
            _x.deps = [node.id];
          }
        }
      }
      let _tmp = 1;
      while (true) {
        const i = _tmp;
        if (i < top.node.deps.length) {
          const node = moonbitlang$core$option$$Option$unwrap$10$(find(moonbitlang$core$array$$Array$op_get$6$(top.node.deps, i)));
          if (!moonbitlang$core$builtin$$Map$contains$8$(visited, node.id)) {
            moonbitlang$core$priority_queue$$T$push$0$(queue, { node: node, tid: next_tid.val });
            moonbitlang$core$builtin$$Map$set$8$(visited, node.id, next_tid.val);
            moonbitlang$core$array$$Array$push$5$(output, { tid: next_tid.val, deps: [node.id], dep_on_active: true });
            next_tid.val = next_tid.val + 1 | 0;
          } else {
            const target_tid = moonbitlang$core$option$$Option$unwrap$3$(moonbitlang$core$builtin$$Map$get$8$(visited, node.id));
            const _bind$2 = moonbitlang$core$array$$Array$search_by$5$(output, (x) => x.tid === target_tid);
            if (_bind$2 === undefined) {
            } else {
              const _Some = _bind$2;
              const _x = _Some;
              moonbitlang$core$array$$Array$op_get$5$(output, _x).dep_on_active = true;
            }
          }
          _tmp = i + 1 | 0;
          continue;
        } else {
          break;
        }
      }
      moonbitlang$core$array$$Array$push$4$(ans.rows, { active: { node: top.node, tid: top.tid }, active_index: cur_index, input: input, cur_tids: cur_tids, output: output });
      continue;
    } else {
      break;
    }
  }
  return ans;
}
function zxch3n$dag$45$view$lib$$render_connection(c, buffer) {
  if (c.up && (c.down && (c.left && c.right))) {
    moonbitlang$core$array$$Array$push$6$(buffer, "─┼─");
    return;
  } else {
    if (c.down && (c.left && c.right)) {
      moonbitlang$core$array$$Array$push$6$(buffer, "─┬─");
      return;
    } else {
      if (c.up && (c.left && c.right)) {
        moonbitlang$core$array$$Array$push$6$(buffer, "─┴─");
        return;
      } else {
        if (c.up && (c.down && c.left)) {
          moonbitlang$core$array$$Array$push$6$(buffer, "─┤ ");
          return;
        } else {
          if (c.up && (c.down && c.right)) {
            moonbitlang$core$array$$Array$push$6$(buffer, " ├─");
            return;
          } else {
            if (c.up && c.left) {
              moonbitlang$core$array$$Array$push$6$(buffer, "─╯ ");
              return;
            } else {
              if (c.up && c.right) {
                moonbitlang$core$array$$Array$push$6$(buffer, " ╰─");
                return;
              } else {
                if (c.down && c.left) {
                  moonbitlang$core$array$$Array$push$6$(buffer, "─╮ ");
                  return;
                } else {
                  if (c.down && c.right) {
                    moonbitlang$core$array$$Array$push$6$(buffer, " ╭─");
                    return;
                  } else {
                    if (c.up && c.down) {
                      moonbitlang$core$array$$Array$push$6$(buffer, " │ ");
                      return;
                    } else {
                      if (c.left && c.right) {
                        moonbitlang$core$array$$Array$push$6$(buffer, "───");
                        return;
                      } else {
                        moonbitlang$core$array$$Array$push$6$(buffer, "   ");
                        return;
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
function zxch3n$dag$45$view$lib$$render_connections(connections, buffer) {
  const _bind = moonbitlang$core$array$$Array$iter$2$(connections);
  _bind((c) => {
    zxch3n$dag$45$view$lib$$render_connection(c, buffer);
    return 1;
  });
}
function zxch3n$dag$45$view$lib$$set_connections(connections, index, target) {
  if (target === undefined) {
    return;
  } else {
    const _Some = target;
    const _x = _Some;
    if (_x === index) {
      moonbitlang$core$array$$Array$op_get$2$(connections, index).up = true;
      moonbitlang$core$array$$Array$op_get$2$(connections, _x).down = true;
    } else {
      if (_x > index) {
        moonbitlang$core$array$$Array$op_get$2$(connections, index).right = true;
        let _tmp = index + 1 | 0;
        while (true) {
          const i = _tmp;
          if (i < _x) {
            moonbitlang$core$array$$Array$op_get$2$(connections, i).left = true;
            moonbitlang$core$array$$Array$op_get$2$(connections, i).right = true;
            _tmp = i + 1 | 0;
            continue;
          } else {
            break;
          }
        }
        moonbitlang$core$array$$Array$op_get$2$(connections, _x).left = true;
      } else {
        if (_x < index) {
          moonbitlang$core$array$$Array$op_get$2$(connections, index).left = true;
          let _tmp = _x + 1 | 0;
          while (true) {
            const i = _tmp;
            if (i < index) {
              moonbitlang$core$array$$Array$op_get$2$(connections, i).left = true;
              moonbitlang$core$array$$Array$op_get$2$(connections, i).right = true;
              _tmp = i + 1 | 0;
              continue;
            } else {
              break;
            }
          }
          moonbitlang$core$array$$Array$op_get$2$(connections, _x).right = true;
        }
      }
    }
    return;
  }
}
function zxch3n$dag$45$view$lib$$max(a, b) {
  return a > b ? a : b;
}
function zxch3n$dag$45$view$lib$$render_row_as_text(row, buffer) {
  const input_conn = moonbitlang$core$array$$Array$map$12$(moonbitlang$core$array$$Array$make$3$(zxch3n$dag$45$view$lib$$max(row.input.length, row.cur_tids.length), 0), (_x) => ({ up: false, down: false, right: false, left: false }));
  const _bind = moonbitlang$core$array$$Array$iter2$5$(row.input);
  _bind((i, input_thread) => {
    const connection_a = moonbitlang$core$array$$Array$search$3$(row.cur_tids, input_thread.tid);
    const connection_b = input_thread.dep_on_active ? row.active_index : undefined;
    moonbitlang$core$array$$Array$op_get$2$(input_conn, i).up = true;
    zxch3n$dag$45$view$lib$$set_connections(input_conn, i, connection_a);
    zxch3n$dag$45$view$lib$$set_connections(input_conn, i, connection_b);
    return 1;
  });
  let _tmp = 0;
  while (true) {
    const i = _tmp;
    if (i < row.cur_tids.length) {
      moonbitlang$core$array$$Array$op_get$2$(input_conn, i).down = true;
      _tmp = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  zxch3n$dag$45$view$lib$$render_connections(input_conn, buffer);
  moonbitlang$core$array$$Array$push$6$(buffer, "\n");
  const _bind$2 = moonbitlang$core$array$$Array$iter$3$(row.cur_tids);
  _bind$2((cur_tid) => {
    if (cur_tid === row.active.tid) {
      moonbitlang$core$array$$Array$push$6$(buffer, " ⊙ ");
    } else {
      moonbitlang$core$array$$Array$push$6$(buffer, " │ ");
    }
    return 1;
  });
  moonbitlang$core$array$$Array$push$6$(buffer, ` ${row.active.node.id}`);
  moonbitlang$core$array$$Array$push$6$(buffer, "\n");
  const output_conn = moonbitlang$core$array$$Array$map$12$(moonbitlang$core$array$$Array$make$3$(zxch3n$dag$45$view$lib$$max(row.output.length, row.cur_tids.length), 0), (_x) => ({ up: false, down: false, right: false, left: false }));
  const _bind$3 = moonbitlang$core$array$$Array$iter2$5$(row.output);
  _bind$3((cur_index, output_thread) => {
    const a = moonbitlang$core$array$$Array$search$3$(row.cur_tids, output_thread.tid);
    const b = output_thread.dep_on_active ? row.active_index : undefined;
    moonbitlang$core$array$$Array$op_get$2$(output_conn, cur_index).down = true;
    zxch3n$dag$45$view$lib$$set_connections(output_conn, cur_index, a);
    zxch3n$dag$45$view$lib$$set_connections(output_conn, cur_index, b);
    return 1;
  });
  let _tmp$2 = 0;
  while (true) {
    const i = _tmp$2;
    if (i < row.cur_tids.length) {
      moonbitlang$core$array$$Array$op_get$2$(output_conn, i).up = true;
      _tmp$2 = i + 1 | 0;
      continue;
    } else {
      break;
    }
  }
  zxch3n$dag$45$view$lib$$render_connections(output_conn, buffer);
  moonbitlang$core$array$$Array$push$6$(buffer, "\n");
}
function zxch3n$dag$45$view$lib$$render_dag_as_text(view) {
  const buffer = moonbitlang$core$array$$Array$new$6$(moonbitlang$core$array$$Array$new$46$capacity$46$default$6$());
  const _bind = moonbitlang$core$array$$Array$iter$4$(view.rows);
  _bind((row) => {
    zxch3n$dag$45$view$lib$$render_row_as_text(row, buffer);
    return 1;
  });
  const ans = { val: "" };
  const _bind$2 = moonbitlang$core$array$$Array$iter$6$(buffer);
  _bind$2((a) => {
    ans.val = `${ans.val}${a}`;
    return 1;
  });
  return ans.val;
}
export { zxch3n$dag$45$view$lib$$visualize as visualize, zxch3n$dag$45$view$lib$$render_dag_as_text as render_dag_as_text }
