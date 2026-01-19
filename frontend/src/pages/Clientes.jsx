import { 
    Container, Title, Table, Group, Button, TextInput, ActionIcon, 
    Modal, Stack, Badge, Select, Text, Card, Grid, Switch // <--- IMPORTANTE: Importar Switch
} from '@mantine/core';
import { IconEdit, IconPlus, IconSearch, IconUser, IconId, IconPhone, IconAt, IconBuildingStore, IconBriefcase } from '@tabler/icons-react';
// (Ya no necesitamos IconTrash si no lo usas en otro lado)
import { useState, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { getCurrentUser } from '../services/auth';
import api from '../services/api';

const Clientes = () => {
    const user = getCurrentUser();
    const isSuperAdmin = user?.rol === 'super_admin';

    const [clientes, setClientes] = useState([]);
    const [empresas, setEmpresas] = useState([]); 
    const [busqueda, setBusqueda] = useState('');
    const [modalAbierto, setModalAbierto] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(false);
    
    // Estado del formulario
    const [form, setForm] = useState({
        id_cliente: null, nombre: '', razon_social: '', ci_nit: '', 
        telefono: '', email: '', estado: 'activo', microempresa_id_manual: null
    });

    useEffect(() => {
        cargarClientes();
        if (isSuperAdmin) cargarEmpresas();
    }, []);

    const cargarClientes = async () => {
        try {
            const res = await api.get('/clientes');
            setClientes(res.data);
        } catch (error) {
            console.error("Error cargando clientes");
        }
    };

    const cargarEmpresas = async () => {
        try {
            const res = await api.get('/clientes/lista-empresas');
            setEmpresas(res.data);
        } catch (error) {
            console.error("Error");
        }
    };

    // --- LÓGICA DEL SWITCH ---
    const handleToggleEstado = async (id, estadoActual) => {
        // Calcular el nuevo estado
        const nuevoEstado = estadoActual === 'activo' ? 'inactivo' : 'activo';

        // 1. Actualización Optimista (Visualmente cambia rápido)
        const clientesActualizados = clientes.map(c => 
            c.id_cliente === id ? { ...c, estado: nuevoEstado } : c
        );
        setClientes(clientesActualizados);

        try {
            // 2. Llamada a la API
            await api.put(`/clientes/${id}/toggle`, { nuevoEstado });
            
            notifications.show({ 
                title: 'Estado Actualizado', 
                message: `Cliente ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`, 
                color: nuevoEstado === 'activo' ? 'green' : 'gray' 
            });
        } catch (error) {
            // Si falla, revertimos el cambio visual
            notifications.show({ title: 'Error', message: 'No se pudo cambiar el estado', color: 'red' });
            cargarClientes(); 
        }
    };

    // ... (Funciones handleGuardar, abrirCrear, abrirEditar se mantienen igual) ...
    // Solo copio las necesarias para que funcione el contexto:

    const handleGuardar = async () => {
         try {
            if (modoEdicion) {
                await api.put(`/clientes/${form.id_cliente}`, form);
                notifications.show({ title: 'Actualizado', message: 'Cliente modificado', color: 'green' });
            } else {
                await api.post('/clientes', form);
                notifications.show({ title: 'Creado', message: 'Cliente registrado', color: 'green' });
            }
            setModalAbierto(false);
            cargarClientes();
        } catch (error) {
            notifications.show({ title: 'Error', message: 'No se pudo guardar', color: 'red' });
        }
    };

    const abrirCrear = () => {
        setForm({ 
            id_cliente: null, nombre: '', razon_social: '', ci_nit: '', 
            telefono: '', email: '', estado: 'activo', microempresa_id_manual: null 
        });
        setModoEdicion(false);
        setModalAbierto(true);
    };

    const abrirEditar = (cliente) => {
        setForm({
            ...cliente,
            razon_social: cliente.razon_social || '',
            microempresa_id_manual: isSuperAdmin ? String(cliente.microempresa_id) : null
        });
        setModoEdicion(true);
        setModalAbierto(true);
    };

    const clientesFiltrados = clientes.filter(c => 
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (c.razon_social && c.razon_social.toLowerCase().includes(busqueda.toLowerCase())) ||
        c.ci_nit.includes(busqueda)
    );

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="lg">
                <Title order={2}>Cartera de Clientes</Title>
                <Button leftSection={<IconPlus size={18} />} onClick={abrirCrear} color="blue">Nuevo Cliente</Button>
            </Group>

            <Card shadow="sm" radius="md" withBorder>

                
                <TextInput 
                        placeholder="Buscar por nombre, email, empresa..."
                        leftSection={<IconSearch size={16} />}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.currentTarget.value)}
                        style={{ flex: 1 }} 
                />

                <Table striped highlightOnHover verticalSpacing="sm">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Nombre</Table.Th>
                            <Table.Th>Razón Social</Table.Th>
                            <Table.Th>CI / NIT</Table.Th>
                            <Table.Th>Teléfono</Table.Th>
                            {isSuperAdmin && <Table.Th>Empresa</Table.Th>}
                            <Table.Th>Estado</Table.Th>
                            <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {clientesFiltrados.map((c) => (
                            <Table.Tr key={c.id_cliente} style={{ opacity: c.estado === 'inactivo' ? 0.6 : 1 }}>
                                <Table.Td fw={500}>{c.nombre}</Table.Td>
                                <Table.Td>{c.razon_social || '-'}</Table.Td>
                                <Table.Td>{c.ci_nit}</Table.Td>
                                <Table.Td>{c.telefono || '-'}</Table.Td>
                                
                                {isSuperAdmin && (
                                    <Table.Td><Badge variant="outline">{c.empresa_nombre}</Badge></Table.Td>
                                )}

                                <Table.Td>
                                    <Badge color={c.estado === 'activo' ? 'green' : 'gray'} variant="light">
                                        {c.estado.toUpperCase()}
                                    </Badge>
                                </Table.Td>

                                <Table.Td>
                                    <Group gap="md">
                                        {/* BOTÓN EDITAR */}
                                        <ActionIcon color="blue" variant="subtle" onClick={() => abrirEditar(c)}>
                                            <IconEdit size={20} />
                                        </ActionIcon>

                                        {/* NUEVO: INTERRUPTOR ACTIVAR/DESACTIVAR */}
                                        <Switch 
                                            size="md"
                                            onLabel="ON" 
                                            offLabel="OFF"
                                            color="green"
                                            checked={c.estado === 'activo'}
                                            onChange={() => handleToggleEstado(c.id_cliente, c.estado)}
                                            style={{ cursor: 'pointer' }}
                                        />
                                    </Group>
                                </Table.Td>
                            </Table.Tr>
                        ))}
                    </Table.Tbody>
                </Table>
            </Card>

            {/* MODAL DE CREACIÓN/EDICIÓN (Mismo que tenías antes) */}
            <Modal opened={modalAbierto} onClose={() => setModalAbierto(false)} title={modoEdicion ? "Editar" : "Nuevo"} size="lg">
                 <Stack>
                    {isSuperAdmin && (
                        <Select
                            label="Asignar a Empresa"
                            searchable
                            data={empresas.map(e => ({ value: String(e.id_microempresa), label: e.nombre }))}
                            value={form.microempresa_id_manual ? String(form.microempresa_id_manual) : null}
                            onChange={(val) => setForm({ ...form, microempresa_id_manual: val })}
                        />
                    )}
                    <Grid>
                        <Grid.Col span={6}>
                            <TextInput label="Nombre" required value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})}/>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <TextInput label="Razón Social" value={form.razon_social} onChange={(e) => setForm({...form, razon_social: e.target.value})}/>
                        </Grid.Col>
                    </Grid>
                    <Grid>
                        <Grid.Col span={6}>
                            <TextInput label="CI/NIT" required value={form.ci_nit} onChange={(e) => setForm({...form, ci_nit: e.target.value})}/>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <TextInput label="Teléfono" value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})}/>
                        </Grid.Col>
                    </Grid>
                    <TextInput label="Email" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})}/>
                    
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={() => setModalAbierto(false)}>Cancelar</Button>
                        <Button onClick={handleGuardar}>Guardar</Button>
                    </Group>
                </Stack>
            </Modal>
        </Container>
    );
};

export default Clientes;