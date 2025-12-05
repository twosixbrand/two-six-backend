import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const locations = [
    {
        name: 'Amazonas',
        shipping_cost: 35000,
        cities: ['Leticia', 'Puerto Nariño', 'Tarapacá', 'La Pedrera'],
    },
    {
        name: 'Antioquia',
        shipping_cost: 15000,
        cities: [
            'Medellín', 'Bello', 'Itagüí', 'Envigado', 'Apartadó', 'Rionegro', 'Turbo', 'Caucasia',
            'Sabaneta', 'La Estrella', 'Caldas', 'Copacabana', 'Girardota', 'Barbosa', 'Marinilla',
            'Guarne', 'La Ceja', 'El Carmen de Viboral', 'El Retiro', 'Santuario', 'Santa Fe de Antioquia',
            'Sopetrán', 'San Jerónimo', 'Yarumal', 'Santa Rosa de Osos', 'Amagá', 'Ciudad Bolívar',
            'Jardín', 'Andes', 'Urrao', 'Chigorodó', 'Carepa', 'Necoclí', 'Arboletes', 'San Pedro de los Milagros'
        ],
    },
    {
        name: 'Arauca',
        shipping_cost: 25000,
        cities: ['Arauca', 'Arauquita', 'Saravena', 'Tame', 'Fortul', 'Puerto Rondón', 'Cravo Norte'],
    },
    {
        name: 'Atlántico',
        shipping_cost: 18000,
        cities: [
            'Barranquilla', 'Soledad', 'Malambo', 'Sabanalarga', 'Galapa', 'Puerto Colombia',
            'Baranoa', 'Santo Tomás', 'Palmar de Varela', 'Sabanagrande', 'Luruaco'
        ],
    },
    {
        name: 'Bogotá D.C.',
        shipping_cost: 12000,
        cities: ['Bogotá'],
    },
    {
        name: 'Bolívar',
        shipping_cost: 18000,
        cities: [
            'Cartagena', 'Magangué', 'El Carmen de Bolívar', 'Turbaco', 'Arjona', 'Mompós',
            'San Juan Nepomuceno', 'San Jacinto', 'Santa Rosa del Sur', 'Achí'
        ],
    },
    {
        name: 'Boyacá',
        shipping_cost: 15000,
        cities: [
            'Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá', 'Puerto Boyacá', 'Paipa',
            'Moniquirá', 'Samacá', 'Nobsa', 'Villa de Leyva', 'Garagoa', 'Soatá'
        ],
    },
    {
        name: 'Caldas',
        shipping_cost: 15000,
        cities: [
            'Manizales', 'La Dorada', 'Chinchiná', 'Villamaría', 'Riosucio', 'Anserma',
            'Supía', 'Salamina', 'Manzanares', 'Aguadas', 'Neira'
        ],
    },
    {
        name: 'Caquetá',
        shipping_cost: 25000,
        cities: ['Florencia', 'San Vicente del Caguán', 'Cartagena del Chairá', 'Puerto Rico', 'El Doncello'],
    },
    {
        name: 'Casanare',
        shipping_cost: 20000,
        cities: ['Yopal', 'Aguazul', 'Villanueva', 'Paz de Ariporo', 'Monterrey', 'Tauramena', 'Maní'],
    },
    {
        name: 'Cauca',
        shipping_cost: 20000,
        cities: [
            'Popayán', 'Santander de Quilichao', 'Puerto Tejada', 'Patía', 'Piendamó',
            'El Tambo', 'Miranda', 'Corinto', 'Caloto'
        ],
    },
    {
        name: 'Cesar',
        shipping_cost: 20000,
        cities: [
            'Valledupar', 'Aguachica', 'Agustín Codazzi', 'Bosconia', 'Curumaní',
            'El Copey', 'La Jagua de Ibirico', 'Chiriguaná'
        ],
    },
    {
        name: 'Chocó',
        shipping_cost: 30000,
        cities: ['Quibdó', 'Istmina', 'Tadó', 'Condoto', 'Riosucio', 'Bahía Solano'],
    },
    {
        name: 'Córdoba',
        shipping_cost: 20000,
        cities: [
            'Montería', 'Lorica', 'Sahagún', 'Cereté', 'Montelíbano', 'Planeta Rica',
            'Tierralta', 'Ciénaga de Oro', 'Chinú', 'Ayapel'
        ],
    },
    {
        name: 'Cundinamarca',
        shipping_cost: 12000,
        cities: [
            'Soacha', 'Facatativá', 'Fusagasugá', 'Zipaquirá', 'Chía', 'Girardot',
            'Mosquera', 'Madrid', 'Funza', 'Cajicá', 'Tocancipá', 'Cota', 'Sibaté',
            'Villeta', 'La Mesa', 'Anapoima', 'Guaduas', 'Ubaté', 'Pacho'
        ],
    },
    {
        name: 'Guainía',
        shipping_cost: 35000,
        cities: ['Inírida'],
    },
    {
        name: 'Guaviare',
        shipping_cost: 30000,
        cities: ['San José del Guaviare', 'Calamar', 'El Retorno', 'Miraflores'],
    },
    {
        name: 'Huila',
        shipping_cost: 18000,
        cities: [
            'Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'San Agustín',
            'Gigante', 'Aipe', 'Palermo', 'Rivera'
        ],
    },
    {
        name: 'La Guajira',
        shipping_cost: 22000,
        cities: ['Riohacha', 'Maicao', 'Uribia', 'Manaure', 'Fonseca', 'San Juan del Cesar', 'Barrancas'],
    },
    {
        name: 'Magdalena',
        shipping_cost: 20000,
        cities: [
            'Santa Marta', 'Ciénaga', 'Zona Bananera', 'Fundación', 'El Banco',
            'Plato', 'Aracataca', 'Pivijay'
        ],
    },
    {
        name: 'Meta',
        shipping_cost: 18000,
        cities: [
            'Villavicencio', 'Acacías', 'Granada', 'Puerto López', 'San Martín',
            'Cumaral', 'Restrepo', 'Puerto Gaitán'
        ],
    },
    {
        name: 'Nariño',
        shipping_cost: 22000,
        cities: [
            'Pasto', 'Tumaco', 'Ipiales', 'La Unión', 'Samaniego', 'Túquerres',
            'El Charco', 'Barbacoas'
        ],
    },
    {
        name: 'Norte de Santander',
        shipping_cost: 20000,
        cities: [
            'Cúcuta', 'Ocaña', 'Villa del Rosario', 'Los Patios', 'Pamplona',
            'Tibú', 'El Zulia', 'Chinácota'
        ],
    },
    {
        name: 'Putumayo',
        shipping_cost: 30000,
        cities: ['Mocoa', 'Puerto Asís', 'Orito', 'Sibundoy', 'Villagarzón', 'Puerto Guzmán'],
    },
    {
        name: 'Quindío',
        shipping_cost: 15000,
        cities: [
            'Armenia', 'Calarcá', 'La Tebaida', 'Circasia', 'Montenegro',
            'Quimbaya', 'Salento', 'Filandia'
        ],
    },
    {
        name: 'Risaralda',
        shipping_cost: 15000,
        cities: [
            'Pereira', 'Dosquebradas', 'Santa Rosa de Cabal', 'La Virginia',
            'Belén de Umbría', 'Marsella', 'Quinchía'
        ],
    },
    {
        name: 'San Andrés y Providencia',
        shipping_cost: 35000,
        cities: ['San Andrés', 'Providencia'],
    },
    {
        name: 'Santander',
        shipping_cost: 18000,
        cities: [
            'Bucaramanga', 'Floridablanca', 'Barrancabermeja', 'Girón', 'Piedecuesta',
            'San Gil', 'Socorro', 'Barbosa', 'Vélez', 'Cimitarra', 'Rionegro', 'Lebrija'
        ],
    },
    {
        name: 'Sucre',
        shipping_cost: 20000,
        cities: [
            'Sincelejo', 'Corozal', 'San Marcos', 'San Onofre', 'Tolú',
            'Sampués', 'Sincé'
        ],
    },
    {
        name: 'Tolima',
        shipping_cost: 15000,
        cities: [
            'Ibagué', 'Espinal', 'Melgar', 'Chaparral', 'Líbano', 'Guamo',
            'Mariquita', 'Honda', 'Flandes', 'Fresno'
        ],
    },
    {
        name: 'Valle del Cauca',
        shipping_cost: 18000,
        cities: [
            'Cali', 'Buenaventura', 'Palmira', 'Tuluá', 'Yumbo', 'Cartago', 'Jamundí', 'Buga',
            'Candelaria', 'Florida', 'Pradera', 'El Cerrito', 'Zarzal', 'Sevilla', 'Roldanillo',
            'Caicedonia', 'Bugalagrande', 'Dagua'
        ],
    },
    {
        name: 'Vaupés',
        shipping_cost: 35000,
        cities: ['Mitú', 'Carurú', 'Taraira'],
    },
    {
        name: 'Vichada',
        shipping_cost: 35000,
        cities: ['Puerto Carreño', 'La Primavera', 'Santa Rosalía', 'Cumaribo'],
    },
];

async function main() {
    console.log('Start seeding locations...');

    for (const dept of locations) {
        const department = await prisma.department.upsert({
            where: { name: dept.name },
            update: {},
            create: {
                name: dept.name,
            },
        });

        console.log(`Created/Updated Department: ${department.name}`);

        // Delete existing cities to avoid duplicates (or use upsert if you have unique constraints on name+dept)
        await prisma.city.deleteMany({
            where: { id_department: department.id },
        });

        for (const cityName of dept.cities) {
            await prisma.city.create({
                data: {
                    name: cityName,
                    id_department: department.id,
                    shipping_cost: dept.shipping_cost,
                },
            });
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
