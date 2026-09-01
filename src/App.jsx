import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'

function Inventario() {
  const [inventario, setInventario] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarInventario()
  }, [])

  async function cargarInventario() {
    setCargando(true)
    setError('')

    if (!supabase) {
      setError('Supabase no está configurado en la aplicación.')
      setCargando(false)
      return
    }

    const { data, error } = await supabase
      .from('inventario')
      .select(
        'id, producto_id, sucursal_id, stock, stock_reservado, stock_disponible'
      )

    if (error) {
      setError(error.message)
      setCargando(false)
      return
    }

    const resultado = await Promise.all(
      (data || []).map(async (item) => {
        const { data: producto } = await supabase
          .from('productos')
          .select('codigo, nombre')
          .eq('id', item.producto_id)
          .single()

        const { data: sucursal } = await supabase
          .from('sucursales')
          .select('nombre')
          .eq('id', item.sucursal_id)
          .single()

        return {
          ...item,
          producto_codigo: producto?.codigo || '-',
          producto_nombre: producto?.nombre || 'Sin producto',
          sucursal_nombre: sucursal?.nombre || 'Sin sucursal'
        }
      })
    )

    setInventario(resultado)
    setCargando(false)
  }

  return (
    <div className="products-module">
      <div className="module-header">
        <div>
          <h2>Inventario</h2>
          <p>Existencias por producto y sucursal</p>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {cargando ? (
        <div className="empty">
          <h2>Cargando inventario...</h2>
        </div>
      ) : inventario.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">+</div>
          <h2>Inventario vacío</h2>
          <p>No hay existencias registradas todavía.</p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th>Sucursal</th>
                <th>Stock</th>
                <th>Reservado</th>
                <th>Disponible</th>
              </tr>
            </thead>

            <tbody>
              {inventario.map((item) => (
                <tr key={item.id}>
                  <td>{item.producto_codigo}</td>

                  <td>
                    <strong>{item.producto_nombre}</strong>
                  </td>

                  <td>{item.sucursal_nombre}</td>

                  <td>{item.stock || 0}</td>

                  <td>{item.stock_reservado || 0}</td>

                  <td>{item.stock_disponible || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function App() {
  const [menu, setMenu] = useState('Dashboard')
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [form, setForm] = useState({
    codigo: '',
    codigo_barras: '',
    nombre: '',
    descripcion: '',
    unidad_medida: '',
    precio_compra: '',
    precio_venta: '',
    stock_minimo: '',
    activo: true
  })

  const menuItems = [
    'Dashboard',
    'Inventario',
    'Productos',
    'Ventas',
    'Compras',
    'Traslados',
    'Clientes',
    'Proveedores',
    'Usuarios'
  ]

  useEffect(() => {
    if (menu === 'Productos') {
      cargarProductos()
    }
  }, [menu])

  async function cargarProductos() {
    setCargando(true)
    setError('')

    if (!supabase) {
      setError('Supabase no está configurado en la aplicación.')
      setCargando(false)
      return
    }

    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setProductos(data || [])
    }

    setCargando(false)
  }

  function cambiarCampo(e) {
    const { name, value, type, checked } = e.target

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  async function guardarProducto(e) {
    e.preventDefault()
    setError('')

    if (!supabase) {
      setError('Supabase no está configurado.')
      return
    }

    if (!form.nombre.trim()) {
      setError('El nombre del producto es obligatorio.')
      return
    }

    const producto = {
      codigo: form.codigo || null,
      codigo_barras: form.codigo_barras || null,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion || null,
      unidad_medida: form.unidad_medida || null,
      precio_compra: Number(form.precio_compra) || 0,
      precio_venta: Number(form.precio_venta) || 0,
      stock_minimo: Number(form.stock_minimo) || 0,
      activo: form.activo
    }

    const { error } = await supabase
      .from('productos')
      .insert([producto])

    if (error) {
      setError(error.message)
      return
    }

    setForm({
      codigo: '',
      codigo_barras: '',
      nombre: '',
      descripcion: '',
      unidad_medida: '',
      precio_compra: '',
      precio_venta: '',
      stock_minimo: '',
      activo: true
    })

    setMostrarFormulario(false)
    cargarProductos()
  }

  async function eliminarProducto(id) {
    if (!window.confirm('¿Seguro que deseas eliminar este producto?')) {
      return
    }

    if (!supabase) {
      setError('Supabase no está configurado.')
      return
    }

    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id)

    if (error) {
      setError(error.message)
      return
    }

    cargarProductos()
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-icon">SC</div>

          <div>
            <strong>StockControl</strong>
            <span>PRO</span>
          </div>
        </div>

        <nav>
          {menuItems.map((item) => (
            <button
              key={item}
              className={menu === item ? 'active' : ''}
              onClick={() => setMenu(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <span>StockControl PRO</span>
          <small>Sistema de inventario</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{menu}</h1>
            <p>Panel de control de tu negocio</p>
          </div>

          <div className="user">
            <div className="avatar">CC</div>

            <div>
              <strong>Administrador</strong>
              <small>Usuario principal</small>
            </div>
          </div>
        </header>

        <section className="content">
          {menu === 'Dashboard' && (
            <>
              <div className="cards">
                <div className="card">
                  <span>Productos</span>
                  <strong>{productos.length}</strong>
                  <small>Productos registrados</small>
                </div>

                <div className="card">
                  <span>Inventario</span>
                  <strong>$0.00</strong>
                  <small>Valor del inventario</small>
                </div>

                <div className="card">
                  <span>Ventas</span>
                  <strong>$0.00</strong>
                  <small>Ventas del período</small>
                </div>

                <div className="card">
                  <span>Stock bajo</span>
                  <strong>0</strong>
                  <small>Productos por reponer</small>
                </div>
              </div>

              <div className="welcome">
                <h2>Bienvenido a StockControl PRO</h2>

                <p>
                  Administra productos, inventario, compras, ventas y
                  movimientos desde un solo lugar.
                </p>

                <button onClick={() => setMenu('Productos')}>
                  Comenzar
                </button>
              </div>
            </>
          )}

          {menu === 'Productos' && (
            <div className="products-module">
              <div className="module-header">
                <div>
                  <h2>Productos</h2>
                  <p>Administra los productos de tu negocio</p>
                </div>

                <button
                  onClick={() =>
                    setMostrarFormulario(!mostrarFormulario)
                  }
                >
                  {mostrarFormulario
                    ? 'Cerrar'
                    : '+ Nuevo producto'}
                </button>
              </div>

              {mostrarFormulario && (
                <form
                  onSubmit={guardarProducto}
                  className="product-form"
                >
                  <input
                    name="codigo"
                    placeholder="Código"
                    value={form.codigo}
                    onChange={cambiarCampo}
                  />

                  <input
                    name="codigo_barras"
                    placeholder="Código de barras"
                    value={form.codigo_barras}
                    onChange={cambiarCampo}
                  />

                  <input
                    name="nombre"
                    placeholder="Nombre del producto *"
                    value={form.nombre}
                    onChange={cambiarCampo}
                    required
                  />

                  <input
                    name="descripcion"
                    placeholder="Descripción"
                    value={form.descripcion}
                    onChange={cambiarCampo}
                  />

                  <input
                    name="unidad_medida"
                    placeholder="Unidad de medida"
                    value={form.unidad_medida}
                    onChange={cambiarCampo}
                  />

                  <input
                    name="precio_compra"
                    type="number"
                    step="0.01"
                    placeholder="Precio de compra"
                    value={form.precio_compra}
                    onChange={cambiarCampo}
                  />

                  <input
                    name="precio_venta"
                    type="number"
                    step="0.01"
                    placeholder="Precio de venta"
                    value={form.precio_venta}
                    onChange={cambiarCampo}
                  />

                  <input
                    name="stock_minimo"
                    type="number"
                    placeholder="Stock mínimo"
                    value={form.stock_minimo}
                    onChange={cambiarCampo}
                  />

                  <label>
                    <input
                      name="activo"
                      type="checkbox"
                      checked={form.activo}
                      onChange={cambiarCampo}
                    />
                    Producto activo
                  </label>

                  <button type="submit">
                    Guardar producto
                  </button>
                </form>
              )}

              {error && (
                <div className="error">
                  {error}
                </div>
              )}

              {cargando ? (
                <div className="empty">
                  Cargando productos...
                </div>
              ) : productos.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">+</div>

                  <h2>No hay productos</h2>

                  <p>
                    Comienza agregando tu primer producto.
                  </p>
                </div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Producto</th>
                        <th>Unidad</th>
                        <th>Compra</th>
                        <th>Venta</th>
                        <th>Stock mínimo</th>
                        <th>Estado</th>
                        <th>Acción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {productos.map((producto) => (
                        <tr key={producto.id}>
                          <td>
                            {producto.codigo || '-'}
                          </td>

                          <td>
                            <strong>
                              {producto.nombre}
                            </strong>
                          </td>

                          <td>
                            {producto.unidad_medida || '-'}
                          </td>

                          <td>
                            $
                            {Number(
                              producto.precio_compra || 0
                            ).toFixed(2)}
                          </td>

                          <td>
                            $
                            {Number(
                              producto.precio_venta || 0
                            ).toFixed(2)}
                          </td>

                          <td>
                            {producto.stock_minimo || 0}
                          </td>

                          <td>
                            {producto.activo
                              ? 'Activo'
                              : 'Inactivo'}
                          </td>

                          <td>
                            <button
                              onClick={() =>
                                eliminarProducto(
                                  producto.id
                                )
                              }
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {menu === 'Inventario' && <Inventario />}

          {![
            'Dashboard',
            'Productos',
            'Inventario'
          ].includes(menu) && (
            <div className="empty">
              <div className="empty-icon">+</div>

              <h2>{menu}</h2>

              <p>
                Este módulo estará disponible en la siguiente etapa.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default App
