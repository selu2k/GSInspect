import json
import csv
import random
from django.core.management.base import BaseCommand
from api.models import Supplier, Bolt, Test, TestCurve
from pathlib import Path


class Command(BaseCommand):
    help = 'Seed the database with bolt test data from JSON and CSV files, plus additional mock data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Clear all existing data before seeding'
        )

    def handle(self, *args, **options):
        # Clear existing data if --flush flag is provided
        if options['flush']:
            self.stdout.write(self.style.WARNING("Clearing existing data..."))
            TestCurve.objects.all().delete()
            Test.objects.all().delete()
            Bolt.objects.all().delete()
            Supplier.objects.all().delete()
        
        # Load products
        products_file = Path(__file__).resolve().parent.parent.parent / 'mock_data' / 'products.json'
        with open(products_file, 'r') as f:
            products = json.load(f)
        
        # Create supplier
        self.stdout.write(self.style.SUCCESS("Creating supplier..."))
        supplier = Supplier.objects.create(name="Supplier A")
        
        # Create bolts and map by name
        self.stdout.write(self.style.SUCCESS("Creating bolts..."))
        bolt_map = {}
        for product in products:
            bolt = Bolt.objects.create(
                supplier=supplier,
                name=product['product_name'],
                length=float(product['bolt_length']),
                diameter=float(product['bolt_diameter']),
                category=product['bolt_category'],
                equipment_compatibility=product['equipment_compatibility'],
                is_published=True
            )
            bolt_map[product['product_name']] = bolt
        
        # Load tests
        tests_file = Path(__file__).resolve().parent.parent.parent / 'mock_data' / 'tests.json'
        with open(tests_file, 'r') as f:
            tests_data = json.load(f)
        
        # Build test-to-bolt mapping from test_curves.csv
        curves_file = Path(__file__).resolve().parent.parent.parent / 'mock_data' / 'test_curves.csv'
        test_to_bolt_map = {}
        curve_data_by_test = {}
        
        with open(curves_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            # Strip whitespace from fieldnames
            reader.fieldnames = [field.strip() if field else field for field in reader.fieldnames]
            
            for row in reader:
                # Skip empty rows
                if not row or all(not v for v in row.values()):
                    continue
                
                # Create a clean row dict with stripped keys and values
                clean_row = {k.strip() if k else k: v.strip() if v else v for k, v in row.items()}
                
                test_id = int(clean_row['TestID'])
                product_name = clean_row['Product Name']
                
                # Map test to bolt
                if test_id not in test_to_bolt_map:
                    test_to_bolt_map[test_id] = product_name
                
                # Collect curve data (convert empty strings to None)
                if test_id not in curve_data_by_test:
                    curve_data_by_test[test_id] = []
                
                displacement_str = clean_row.get('Displacement (mm)', '').strip()
                load_str = clean_row.get('Dynamic Load (kN)', '').strip()
                
                curve_data_by_test[test_id].append({
                    'displacement': float(displacement_str) if displacement_str else None,
                    'load': float(load_str) if load_str else None
                })
        
        # Create tests from JSON/CSV
        self.stdout.write(self.style.SUCCESS("Creating tests from files..."))
        test_map = {}
        for test_data in tests_data:
            test_id = int(test_data['test_id'])
            
            # Determine which bolt this test belongs to
            if test_id in test_to_bolt_map:
                # Use mapping from curves CSV
                bolt_name = test_to_bolt_map[test_id]
                bolt = bolt_map.get(bolt_name)
            else:
                # If no explicit mapping, assign to first bolt
                bolt = list(bolt_map.values())[0]
            
            if bolt:
                test = Test.objects.create(
                    bolt=bolt,
                    methodology=test_data['test_methodology'],
                    facility=test_data['test_facility'],
                    installation_method=test_data.get('installation_method'),
                    encapsulation_method=test_data.get('encapsulation_method'),
                    peak_strength=test_data.get('peak_strength'),
                    bond_strength=test_data.get('bond_strength'),
                    yield_strength=test_data.get('yield_strength'),
                    ultimate_deformation=test_data.get('ultimate_deformation'),
                    stiffness=test_data.get('stiffness'),
                    loading_rate=test_data.get('loading_rate'),
                    energy_absorption=test_data.get('energy_absorption'),
                    number_of_drops=test_data.get('number_of_drops'),
                    is_published=True
                )
                test_map[test_id] = test
        
        # Create TestCurve objects
        self.stdout.write(self.style.SUCCESS("Creating test curves..."))
        for test_id, curve_pairs in curve_data_by_test.items():
            if test_id in test_map:
                TestCurve.objects.create(
                    test=test_map[test_id],
                    curve_pair=curve_pairs,
                    is_published=True
                )
        
        # Add additional mock data
        self.stdout.write(self.style.SUCCESS("Creating additional suppliers and bolts..."))
        
        # Create additional suppliers
        suppliers = [supplier]
        supplier_names = ["Supplier B", "Supplier C", "Supplier D", "Supplier E"]
        for name in supplier_names:
            s = Supplier.objects.create(name=name)
            suppliers.append(s)
        
        # Define fixed options
        CATEGORIES = [
            "Encapsulated",
            "Grouted",
            "Resin",
            "Mechanical",
            "Hybrid",
            "Split Set"
        ]
        
        EQUIPMENT_COMPATIBILITY = [
            "multi-OEM",
            "handheld",
            "boltec"
        ]
        
        FACILITIES = [
            "Lab A",
            "Lab B",
            "Test Center 1",
            "Test Center 2",
            "Research Facility",
            "Field Site A",
            "Field Site B"
        ]
        
        METHODOLOGIES = ["static", "dynamic"]
        INSTALLATION_METHODS = ["Manual or Handheld", "Mechanized"]
        ENCAPSULATION_METHODS = ["Capsule", "Cartridge", "Tube"]
        
        # Create additional bolts for new suppliers
        bolts = list(bolt_map.values())
        
        # Create ~100 bolts across all suppliers
        bolt_count = len(bolts)
        target_bolts = 100
        bolts_to_create = target_bolts - bolt_count
        bolts_per_supplier = bolts_to_create // len(suppliers[1:])
        
        for supplier in suppliers[1:]:
            for i in range(bolts_per_supplier):
                category = random.choice(CATEGORIES)
                diameter = random.choice([16, 20, 22, 25, 28, 32])
                equipment_compat = random.sample(EQUIPMENT_COMPATIBILITY, k=random.randint(1, 3))
                bolt = Bolt.objects.create(
                    supplier=supplier,
                    name=f"{category} Bolt D{diameter}mm x 2.4m - {supplier.name} - {i+1}",
                    length=round(random.uniform(1.5, 3.5), 1),
                    diameter=diameter,
                    category=category,
                    equipment_compatibility=equipment_compat,
                    is_published=True
                )
                bolts.append(bolt)
        
        # Create additional tests across all bolts
        self.stdout.write(self.style.SUCCESS("Creating additional tests..."))
        additional_test_count = 0
        
        # Create ~1000 tests
        target_tests = 1000
        tests_per_bolt = target_tests // len(bolts)
        extra_tests = target_tests % len(bolts)
        
        for idx, bolt in enumerate(bolts):
            # Distribute extra tests among first bolts
            num_tests = tests_per_bolt + (1 if idx < extra_tests else 0)
            
            for _ in range(num_tests):
                methodology = random.choice(METHODOLOGIES)
                facility = random.choice(FACILITIES)
                
                # Generate realistic test data
                peak_strength = round(random.uniform(25, 45), 2)
                bond_strength = round(random.uniform(100, 200), 2) if random.random() > 0.3 else None
                yield_strength = round(random.uniform(140, 180), 2)
                ultimate_deformation = round(random.uniform(150, 250), 2)
                stiffness = round(random.uniform(300, 500), 2) if random.random() > 0.4 else None
                loading_rate = round(random.uniform(1, 10), 2) if methodology == "static" else None
                energy_absorption = round(random.uniform(50, 150), 2) if methodology == "dynamic" else None
                number_of_drops = random.randint(1, 20) if methodology == "dynamic" else None
                
                test = Test.objects.create(
                    bolt=bolt,
                    methodology=methodology,
                    facility=facility,
                    installation_method=random.choice(INSTALLATION_METHODS),
                    encapsulation_method=random.choice(ENCAPSULATION_METHODS),
                    peak_strength=peak_strength,
                    bond_strength=bond_strength,
                    yield_strength=yield_strength,
                    ultimate_deformation=ultimate_deformation,
                    stiffness=stiffness,
                    loading_rate=loading_rate,
                    energy_absorption=energy_absorption,
                    number_of_drops=number_of_drops,
                    is_published=True
                )
                additional_test_count += 1
                
                # Create test curve with realistic displacement/load data
                curve_points = []
                num_points = random.randint(50, 100)
                for i in range(num_points):
                    displacement = round(i * 0.5, 2)
                    # Create a realistic load curve with peak and decline
                    load_value = peak_strength * 20 * (1 - (i / 200) ** 2) if i < 100 else peak_strength * 20 * 0.5
                    load_value = round(load_value + random.uniform(-5, 5), 2)
                    curve_points.append({
                        "displacement": displacement,
                        "load": max(0, load_value)
                    })
                
                TestCurve.objects.create(
                    test=test,
                    curve_pair=curve_points,
                    is_published=True
                )
                
                # Print progress every 100 tests
                if additional_test_count % 100 == 0:
                    self.stdout.write(f"  Created {additional_test_count} tests...")
        
        total_tests = len(test_map) + additional_test_count
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded database'))
        self.stdout.write(f'  Suppliers: {len(suppliers)}')
        self.stdout.write(f'  Bolts: {len(bolts)}')
        self.stdout.write(f'  Tests from files: {len(test_map)}')
        self.stdout.write(f'  Additional tests: {additional_test_count}')
        self.stdout.write(f'  Total tests: {total_tests}')
        self.stdout.write(f'  Facilities: {len(FACILITIES)} unique locations')
