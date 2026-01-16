import { 
  TextInput, 
  PasswordInput, 
  Button, 
  Paper, 
  Title, 
  Container, 
  Select, 
  Group, 
  Stack,
  Center,
  Box
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/auth';
import api from '../services/api';

export function Registrar() {
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      confirmPassword: '',
      rol_id: '',
    },

    validate: {
      nombre: (value) => (value.length < 2 ? 'Nombre muy corto' : null),
      apellido: (value) => (value.length < 2 ? 'Apellido muy corto' : null),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Email inválido'),
      password: (value) => (value.length < 6 ? 'La contraseña debe tener al menos 6 caracteres' : null),
      confirmPassword: (value, values) => 
        value !== values.password ? 'Las contraseñas no coinciden' : null,
      rol_id: (value) => (value ? null : 'Selecciona un rol'),
    },
  });

  const handleSubmit = async (values) => {
    try {
      const dataToSend = {
        nombre: values.nombre,
        apellido: values.apellido,
        email: values.email,
        password: values.password,
        microempresa_id: 5, // Por defecto para pruebas
        rol_id: parseInt(values.rol_id)
      };

      await api.post('/auth/register', dataToSend);
      
      notifications.show({
        title: '¡Registro exitoso!',
        message: 'Tu cuenta ha sido creada correctamente',
        color: 'green',
      });

      // Intentar login automático
      await login(values.email, values.password);
      navigate('/dashboard');
      
    } catch (error) {
      notifications.show({
        title: 'Error en el registro',
        message: error.response?.data?.message || 'Error al crear la cuenta',
        color: 'red',
      });
    }
  };

  return (
    <Center mih="100vh" bg="gray.0">
      <Container size={480} py={40}>
        <Box ta="center" mb={30}>
          <Title order={1} c="blue.7" fw={900}>
            Crear Nueva Cuenta
          </Title>
          <Title order={4} c="gray.6" fw={400} mt="xs">
            Sistema de Gestión para Microempresas
          </Title>
        </Box>
        
        <Paper withBorder shadow="lg" p={40} radius="lg" bg="white">
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack gap="md">
              <Group grow>
                <TextInput 
                  label="Nombre" 
                  placeholder="Ej: Alejandra" 
                  required 
                  {...form.getInputProps('nombre')}
                  radius="md"
                />
                <TextInput 
                  label="Apellido" 
                  placeholder="Ej: Cruz" 
                  required 
                  {...form.getInputProps('apellido')}
                  radius="md"
                />
              </Group>

              <TextInput 
                label="Correo electrónico" 
                placeholder="correo@ejemplo.com" 
                required 
                {...form.getInputProps('email')}
                radius="md"
              />
              
              <PasswordInput 
                label="Contraseña" 
                placeholder="Mínimo 6 caracteres" 
                required 
                {...form.getInputProps('password')}
                radius="md"
              />

              <PasswordInput 
                label="Confirmar Contraseña" 
                placeholder="Repite tu contraseña" 
                required 
                {...form.getInputProps('confirmPassword')}
                radius="md"
              />

              <Select
                label="Rol"
                placeholder="Selecciona tu rol"
                data={[
                  /*{ value: '1', label: 'Super Admin' },*/
                  { value: '2', label: 'Administrador' },
                  { value: '3', label: 'Vendedor' }
                ]}
                required
                {...form.getInputProps('rol_id')}
                radius="md"
              />

              <Button 
                fullWidth 
                size="md" 
                type="submit" 
                mt="xl"
                radius="md"
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan' }}
              >
                Crear Cuenta
              </Button>

              <Button 
                fullWidth 
                variant="subtle" 
                onClick={() => navigate('/login')}
                radius="md"
              >
                ¿Ya tienes cuenta? Inicia Sesión
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Center>
  );
}