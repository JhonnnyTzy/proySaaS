import { AppShell, Burger, Group, NavLink, Button, Text, Avatar, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { 
  IconHome2, 
  IconUsers, 
  IconLogout,
  IconUserCircle,
  IconSettings
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/auth';

export function MainLayout({ children }) {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const items = [
      { label: 'Dashboard', icon: IconHome2, path: '/dashboard', roles: ['super_admin', 'administrador', 'microempresa_P', 'vendedor'] },
    ];

    // Solo ADMIN y MICROEMPRESA_P ven Usuarios
    if (['administrador', 'microempresa_P', 'super_admin'].includes(user?.rol)) {
      items.push({ label: 'Usuarios', icon: IconUsers, path: '/usuarios' });
    }

    return items;
  };

  return (
    <AppShell
      header={{ height: 70 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header px="md">
        <Group h="100%" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Group gap="xs">
              <Text fw={700} size="xl" c="blue.7">
                Gestión Microempresas
              </Text>
            </Group>
          </Group>

          <Group>
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button variant="subtle" p="xs">
                  <Group gap="sm">
                    <Avatar size="sm" color="blue" radius="xl">
                      {user?.nombre?.charAt(0)}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500}>
                        {user?.nombre} {user?.apellido}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {user?.rol?.replace('_', ' ')}
                      </Text>
                    </div>
                  </Group>
                </Button>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Label>Cuenta</Menu.Label>
                <Menu.Item leftSection={<IconUserCircle size={14} />}>
                  Mi Perfil
                </Menu.Item>
                <Menu.Item leftSection={<IconSettings size={14} />}>
                  Configuración
                </Menu.Item>
                
                <Menu.Divider />
                
                <Menu.Label>Empresa</Menu.Label>
                <Text size="sm" c="dimmed" px="xs" py="xs">
                  {user?.empresa_nombre || 'Super Admin'}
                </Text>
                
                <Menu.Divider />
                
                <Menu.Item 
                  color="red" 
                  leftSection={<IconLogout size={14} />}
                  onClick={handleLogout}
                >
                  Cerrar Sesión
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Text size="sm" c="dimmed" mb="md" px="xs">
          Navegación
        </Text>
        
        {getNavItems().map((item, index) => (
          <NavLink
            key={index}
            label={item.label}
            leftSection={<item.icon size={18} />}
            onClick={() => navigate(item.path)}
            active={window.location.pathname === item.path}
            variant="filled"
            mb="xs"
            radius="md"
          />
        ))}
        
        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <Text size="xs" c="dimmed" mb="xs">
            Estado del Sistema
          </Text>
          <Group gap="xs">
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'green' }} />
            <Text size="sm">En línea</Text>
          </Group>
        </div>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}