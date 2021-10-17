require('./main.css');
import m from 'mithril';
import {parse, stringify} from 'transform-parser'



let parts = {
  '-': {},
  '–': {},
  '>': {},
  '<': {},
  '{': {},
  '[': {},
  '.': {},
}

// connectors:

// leaves

// flowers

let T1 = {
  geometry: '<',
  in: {x: 0, y: 0},
  out:[
    {x: -13, y: -20},
    {x: -7, y: 20}
  ]
}

let T2 = {
  geometry: '-',
  in: {x: 0, y: 0},
  out:[
    {x: 2, y: 0}
  ]
}

let T3 = {
  geometry: '+',
  in: {x: 0, y: -15},
  out:[
    {x: 2, y: 0},
    {x: 2, y: 15},
    {x: 2, y: -15},
  ]
}

let T4 = {
  geometry: '{',
  in: {x: 0, y: 0},
  out: [{x: 0, y: 0}]
}

let entity = {
  templates: [T2, T3],
  phase: 0,
  out: [{x: 0, y: 0}],


  offset: {},
  angle: -90,
  scale: 1,
  elements: []
}

let entity_p = {
  offset: {},
  angle: 0,
  scale: 1,
  elements: []
}

//
// let entity = {
//   elements: [
//     {
//       geometry: '–',
//       angle: -90,
//       offset: {},
//       elements: [{
//         geometry: '<',
//         angle: 15,
//         offset: {
//           x: 5,
//           y: 2.5
//         },
//         elements: [
//           {
//             geometry: '-',
//             angle: 45,
//             offset: {
//               x: 40,
//               y: 10
//             },
//             elements: [{
//               geometry: '{',
//               angle: -5,
//               scale: 0.8,
//               weight: 200,
//               offset: {
//                 x: 0,
//                 y: 2
//               },
//               elements: []
//             }]
//           },
//           {
//             geometry: '{',
//             angle: -10,
//             weight: 500,
//             offset: {
//               x: -20,
//               y: -19
//             },
//             elements: [{
//               geometry: '{',
//               angle: -5,
//               scale: 0.8,
//               weight: 200,
//               offset: {
//                 x: -20,
//                 y: 1
//               },
//               elements: [{
//                 geometry: '⁂',
//                 weight:300,
//                 scale: 0.9,
//                 angle: -20,
//                 offset: {
//                   x: -20,
//                   y: 12
//                 },
//                 elements: []
//               }]
//             }]
//           }
//         ]
//       }]
//     },
//   ]
// };


let state = {
  editor: {
    stage: document.getElementById('garden'),
  },
  node: {
    target: null,
    optype: 'r'
  },
  selection: {
    element: entity
  },
  meta: {
    stage: document.getElementById('field-guide')
  }
};

// animations

function apply_transform_to_elements(elements, transform)
{
  elements.forEach(element => {

    element.angle += transform;

    if (typeof element.elements !== 'undefined')
    {
      apply_transform_to_elements(element.elements, transform);
    }
  })
}



// render

function render_node_creator(root, entity)
{
  let d = {
    s: entity.scale || 1.0,
    r: entity.angle || 0
  }

  return m('div', {
    class: 'entity-node-creator',
    style: `
      transform:
        rotate(${-d.r}deg)
        scale(${1.0 / d.s});
    `,
    onclick: () => {
      console.log(root);
      entity.editor = !entity.editor;
      rerender_entity(root, state);
    }
  },
  (entity.editor) ? render_part_palette(root, entity) : []);
}





function rerender_entity(entity, state)
{
  let vnode = m('span', {
    class: 'entity-frame debug'
  }, [
    m('span', {class: 'entity-root debug'}, render_elements(entity, entity.elements)),
  ]);

  m.render(state.editor.stage, vnode);
}

function render_elements(root, elements)
{
  return elements.map(e => {
    let d = {
      x: (e.offset.x || 0),
      y: (e.offset.y || 0),
      s: (e.scale || 1),
      w: (e.weight || 100)
    }

    return m('div', {
      class: 'geometry debug',
      style: `
        font-weight:${e.weight};
        transform:
          scale(${d.s})
          rotate(${e.angle}deg)
          translate(${d.x * (1/d.s)}%,${d.y * (1/d.s)}%);
      `,
      onclick: event => {
        event.stopPropagation();
        state.selection.element = e;
        rerender_editor(state);
      }
      },
      [
        render_glyph_element(root, e),
        render_elements(root, e.elements || [])
      ]
    );
  });
}

function render_handle(root, e, type)
{
  return [m('div', {
    class: `handle ${type}-handle`,
    style: `transform:scale(${1 / (e.scale || 1)})translate(-50%, -50%)`,
    onmousedown: event => {

    }
  })];
}

function render_glyph_element(root, e)
{
  return m('div',
    {class: 'glyph debug'},
    [
      e.geometry,
      render_handle(root, e, 'x'),
      render_handle(root, e, 'y'),
    ]
  );
}

// editor frame


function render_component_data()
{
  return m('div',
    {
      class: 'component-data'
    },
    (state.selection.element == null) ?
    [] : render_component_controls()
  );
}


function render_component_controls()
{
  return [
    m('input', {
      class: 'offset-x-input component-input',
      onchange: event => {
        let x = event.target.value;
        state.selection.element.offset.x = parseFloat(x);
        rerender_entity(entity, state);
        rerender_editor()
      },
      type: 'number',
      value: state.selection.element.offset.x || 0,
      placeholder: 'component x offset'
    }),

    m('input', {
      class: 'offset-y-input component-input',
      onchange: event => {
        let y = event.target.value;
        state.selection.element.offset.y = parseFloat(y);
        rerender_entity(entity, state);
        rerender_editor()
      },
      type: 'number',
      value: state.selection.element.offset.y || 0,
      placeholder: 'component y offset'
    }),

    m('input', {
      class: 'angle-input component-input',
      onchange: event => {
        let theta = event.target.value;
        state.selection.element.angle = parseFloat(theta);
        rerender_entity(entity, state);
        rerender_editor()
      },
      type: 'number',
      value: state.selection.element.angle,
      placeholder: 'component angle'
    }),

    m('input', {
      class: 'scale-input component-input',
      onchange: event => {
        let s = event.target.value;
        state.selection.element.scale = parseFloat(s);
        rerender_entity(entity, state);
        rerender_editor()
      },
      type: 'number',
      value: state.selection.element.scale,
      placeholder: 'component scale'
    }),
  ]
}


function render_entity_part(part)
{
  return m('div', {
    class: 'entity-node-part',
    onclick: event => {
      let data = {
        geometry: part,
        offset: {},
        scale: 1,
        angle: 0,
        elements: []
      }
      state.selection.element.elements.push(data);
      state.selection.element = data;

      rerender_entity(entity, state);
      rerender_editor()
    }
  }, part)
}

function render_part_palette()
{
  return m('div',
    {
      class: 'entity-node-part-palette'
    },
    Object.keys(parts).map(id => {
      return render_entity_part(id)
    })
  );
}

function render_simulate_data()
{
  return m('div',
   {
     class: 'step-simulate-button',
     onclick: e => {
      step_simulation(entity);
      console.log(entity);
      rerender_entity(entity, state);
     }
   }, 'step');
}


function rerender_editor()
{
  let vnode = m('div', {
    class: 'editor-container'
  }, [
    render_part_palette(),
    render_component_data(),
    render_simulate_data()
  ]);

  m.render(state.meta.stage, vnode);
}


function step_simulation(e)
{
  console.log(e);

  // grow the subnodes.
  e.elements.forEach(element => {
    e.scale = Math.min(1, e.scale * 1.1);
    // get the available light from above
    step_simulation(element)
  });


  // select template based on available light,
  // and branching tendency.
  if (e.out.length > 0)
  {
    let out = e.out[0];

    let template = e.templates[Math.floor(Math.random() * e.templates.length)];

    e.elements.push({
      templates: e.templates,
      geometry: template.geometry,
      out: template.out,
      offset: {
        x: out.x + template.in.x,
        y: out.y + template.in.y
      },
      scale: 1,
      angle: Math.random() * 10 - 5,
      elements: []
    });

    e.out = e.out.slice(1);
  }
}

rerender_entity(entity, state);
rerender_editor();

//
// document.addEventListener('mousemove', event => {
//   if (state.node.target !== null)
//   {
//     let n = state.node.target.parentNode.parentNode;
//     let transform = parse(n.style.transform);
//     console.log(transform);
//
//     if (state.node.optype == 'x')
//     {
//       let x = transform.translate[0];
//       x = +x.slice(0, x.length - 1);
//       x += -event.movementY;
//
//       transform.translate[0] = `${x}%`;
//
//       n.style.transform = stringify(transform);
//     }
//
//     if (state.node.optype == 'y')
//     {
//       let x = transform.translate[1];
//       x = +x.slice(0, x.length - 1);
//       x += event.movementX;
//
//       transform.translate[1] = `${x}%`;
//
//       n.style.transform = stringify(transform);
//     }
//
//     if (state.node.optype == 'r')
//     {
//       let r = transform.rotate;
//       r = +r.slice(0, r.length - 3);
//       r += event.movementX;
//
//       transform.rotate = `${r}deg`;
//
//       n.style.transform = stringify(transform);
//     }
//
//   }
// })
//
// document.addEventListener('mouseup', () => {
//   state.node.target = null;
// });


let t = Date.now();
let fps = 32;
let frametime_ms = 1000 / fps;

let frame_index = 0;
let transform = 0.025;

// window.setInterval(() => {
//   console.log(entity);
// }, 1000);

//
// window.setInterval(() => {
//   let t_prime = Date.now();
//   let dt = (t_prime - t) / frametime_ms;
//
//   if (frame_index == 15) {
//     frame_index = -1;
//     transform *= (Math.random() > 0.10) ? -1 : 1;
//   }
//
//   apply_transform_to_elements(entity.elements, (transform + (Math.random() * 0.025) - 0.0125) * dt);
//   rerender_entity(entity, state);
//
//   frame_index += 1;
//
//   // console.log(`frame time: ${dt}`);
//
//
//   t = t_prime;
// }, frametime_ms );
