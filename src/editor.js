require('./main.css');
import m from 'mithril';
import {parse, stringify} from 'transform-parser'


let state = {
  editor: {
    stage: document.getElementById('garden'),
  },
  node: {
    target: null,
    optype: 'r'
  }
};

// connectors:

// leaves

// flowers

let entity_transform_lookup = {
  '-<': {
    offset: {
      x: 0.5,
      y: 2.5
    }
  }
};




let entity = {
  elements: [
    {
      geometry: '–',
      angle: -90,
      offset: {},
      children: [{
        geometry: '<',
        angle: 15,
        offset: {
          x: 5,
          y: 2.5
        },
        children: [
          {
            geometry: '-',
            angle: 45,
            offset: {
              x: 40,
              y: 10
            },
            children: [{
              geometry: '{',
              angle: -5,
              scale: 0.8,
              weight: 200,
              offset: {
                x: 0,
                y: 2
              },
              children: []
            }]
          },
          {
            geometry: '{',
            angle: -10,
            weight: 500,
            offset: {
              x: -20,
              y: -19
            },
            children: [{
              geometry: '{',
              angle: -5,
              scale: 0.8,
              weight: 200,
              offset: {
                x: -20,
                y: 1
              },
              children: [{
                geometry: '⁂',
                weight:300,
                scale: 0.9,
                angle: -20,
                offset: {
                  x: -20,
                  y: 12
                },
                children: []
              }]
            }]
          }
        ]
      }]
    },
  ]
};

// animations

function apply_transform_to_elements(elements, transform)
{
  elements.forEach(element => {

    element.angle += transform;

    if (typeof element.children !== 'undefined')
    {
      apply_transform_to_elements(element.children, transform);
    }
  })
}



// render


function rerender_entity(entity, state)
{
  let vnode = m('span', {
    class: 'entity-frame debug'
  }, m('span', {class: 'entity-root debug'}, render_elements(entity.elements)));

  m.render(state.editor.stage, vnode);
}

function render_elements(elements)
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
      `
      },
      [
        render_glyph_element(e),
        render_elements(e.children || [])
      ]
    );
  });
}

function render_handle(e, type)
{
  return [m('div', {
    class: `handle ${type}-handle`,
    style: `transform:scale(${1 / (e.scale || 1)})translate(-50%, -50%)`,
    onmousedown: event => {
      let node = event.target;
      node.classList.add('active');
      state.node.target = node;
      state.node.optype = type;
    }
  })];
}

function render_glyph_element(e)
{
  return m('div', {class: 'glyph debug'}, [e.geometry, render_handle(e, 'x'), render_handle(e, 'y')])
}


rerender_entity(entity, state);


document.addEventListener('mousemove', event => {
  if (state.node.target !== null)
  {
    console.log(event);

    let n = state.node.target.parentNode.parentNode;
    let transform = parse(n.style.transform);
    console.log(transform);

    if (state.node.optype == 'x')
    {
      let x = transform.translate[0];
      x = +x.slice(0, x.length - 1);
      x += -event.movementY;

      transform.translate[0] = `${x}%`;

      n.style.transform = stringify(transform);
    }

    if (state.node.optype == 'y')
    {
      let x = transform.translate[1];
      x = +x.slice(0, x.length - 1);
      x += event.movementX;

      transform.translate[1] = `${x}%`;

      n.style.transform = stringify(transform);
    }

    if (state.node.optype == 'r')
    {
      let r = transform.rotate;
      r = +r.slice(0, r.length - 3);
      r += event.movementX;

      transform.rotate = `${r}deg`;

      n.style.transform = stringify(transform);
    }

  }
})

document.addEventListener('mouseup', () => {
  state.node.target = null;
});


let t = Date.now();
let fps = 32;
let frametime_ms = 1000 / fps;

let frame_index = 0;
let transform = 0.025;


window.setInterval(() => {
  let t_prime = Date.now();
  let dt = (t_prime - t) / frametime_ms;

  if (frame_index == 15) {
    frame_index = -1;
    transform *= (Math.random() > 0.10) ? -1 : 1;
  }

  apply_transform_to_elements(entity.elements, (transform + (Math.random() * 0.025) - 0.0125) * dt);
  rerender_entity(entity, state);

  frame_index += 1;

  // console.log(`frame time: ${dt}`);


  t = t_prime;
}, frametime_ms );
