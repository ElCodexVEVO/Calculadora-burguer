"""Escena 3D de la insignia de temporada: vela, cempasúchil y calabaza.

Se ejecuta con Blender en segundo plano y exporta un .glb ligero para la web:

    blender --background --python design/temporada/escena_3d.py -- assets/season/escena-temporada.glb

Todo es geometría procedural con materiales PBR simples (sin texturas). La llama y su
núcleo son objetos aparte («Llama», «LlamaNucleo») para animarlos en el navegador.
"""
import math
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

OUT = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "escena-temporada.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
COLLECTION = bpy.context.scene.collection


def lin(hex_color):
    """Color sRGB hexadecimal → lineal (lo que espera Principled BSDF)."""
    h = hex_color.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return out


def material(name, color, rough=0.6, emission=None, strength=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*lin(color), 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = 0
    if emission:
        b.inputs["Emission Color"].default_value = (*lin(emission), 1)
        b.inputs["Emission Strength"].default_value = strength
    return m


def to_object(name, bm, mat, sharp_angle=40):
    mesh = bpy.data.meshes.new(name)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = True
    if sharp_angle and hasattr(mesh, "set_sharp_from_angle"):
        mesh.set_sharp_from_angle(angle=math.radians(sharp_angle))
    obj = bpy.data.objects.new(name, mesh)
    COLLECTION.objects.link(obj)
    mesh.materials.append(mat)
    return obj


def add_sphere(bm, radius, scale, matrix, u=10, v=8):
    geo = bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=radius)
    full = matrix @ Matrix.Diagonal((*scale, 1))
    bmesh.ops.transform(bm, matrix=full, verts=geo["verts"])
    return geo["verts"]


# ── Materiales ──
CERA = material("Cera", "#f6e3bd", 0.5, "#ffb060", 0.10)
MECHA = material("Mecha", "#2c1a10", 0.9)
FUEGO = material("Fuego", "#ffb53e", 0.4, "#ff9a1f", 5.0)
NUCLEO = material("FuegoNucleo", "#fff3c4", 0.4, "#ffe9a8", 7.0)
PETALO = [material(f"Petalo{i}", c, 0.62) for i, c in enumerate(("#c9560c", "#e06a0e", "#f28c1b", "#f9a737", "#fbbb55"))]
HOJA = material("Hoja", "#3f4a2a", 0.7)
CALABAZA = material("Calabaza", "#e8700f", 0.48)
TALLO = material("Tallo", "#5a4526", 0.8)
CARA = material("Cara", "#241006", 0.9)

# ── Vela ──
bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=28, radius1=0.5, radius2=0.5, depth=2.0, matrix=Matrix.Translation((0, 0, 1.0)))
top_edges = [e for e in bm.edges if all(abs(v.co.z - 2.0) < 1e-4 for v in e.verts)]
bmesh.ops.bevel(bm, geom=top_edges, offset=0.07, segments=3, affect="EDGES", profile=0.6)
# Gotas de cera en la mitad que mira a la cámara (−Y).
for angle, length in ((200, 0.55), (232, 0.85), (262, 0.45), (292, 0.95), (322, 0.6), (350, 0.4), (176, 0.7)):
    a = math.radians(angle)
    add_sphere(bm, 0.1, (1, 1, length / 0.2), Matrix.Translation((math.cos(a) * 0.47, math.sin(a) * 0.47, 2.0 - length * 0.5)), u=8, v=6)
# Charco fundido alrededor de la mecha.
add_sphere(bm, 0.36, (1, 1, 0.08), Matrix.Translation((0, 0, 1.99)), u=16, v=6)
vela = to_object("Vela", bm, CERA)
vela.location = (-0.98, 0.15, 0)

bm = bmesh.new()
bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.03, radius2=0.022, depth=0.3, matrix=Matrix.Translation((0, 0, 0.15)))
mecha = to_object("Mecha", bm, MECHA)
mecha.location = (-0.98, 0.15, 2.0)


def flame(name, base, height, mat):
    """Lágrima de revolución con el origen en la base (la mecha)."""
    bm = bmesh.new()
    geo = bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=12, radius=1.0)
    for v in geo["verts"]:
        t = (v.co.z + 1) / 2
        r = (math.sin(math.pi * min(1.0, t * 1.08)) ** 0.75) * (1 - t * 0.6) * base * 1.9
        d = Vector((v.co.x, v.co.y))
        if d.length > 1e-6:
            d.normalize()
        v.co = Vector((d.x * r, d.y * r, t * height))
    return to_object(name, bm, mat, sharp_angle=0)


llama = flame("Llama", 0.2, 0.82, FUEGO)
llama.location = (-0.98, 0.15, 2.22)
nucleo = flame("LlamaNucleo", 0.1, 0.44, NUCLEO)
nucleo.location = (-0.98, 0.1, 2.26)

# ── Cempasúchil: cinco coronas de pétalos que se cierran hacia el centro ──
FLOWER_AXIS = Matrix.Translation((0.12, -0.38, 0.95)) @ Matrix.Rotation(math.radians(62), 4, "X") @ Matrix.Scale(0.86, 4)
LAYERS = ((17, 0.66, 8, 0.00, 1.0), (15, 0.53, 22, 0.07, 0.95), (12, 0.39, 38, 0.14, 0.86), (9, 0.25, 55, 0.20, 0.74), (6, 0.11, 72, 0.25, 0.6))
for index, (count, radius, tilt, lift, size) in enumerate(LAYERS):
    bm = bmesh.new()
    for i in range(count):
        angle = 2 * math.pi * i / count + index * 0.37
        verts = add_sphere(bm, 1.0, (0.34 * size, 0.2 * size, 0.07), Matrix.Identity(4), u=8, v=6)
        for v in verts:  # punta levantada y borde ondulado
            v.co.z += 0.55 * v.co.x * abs(v.co.x) + 0.25 * v.co.y * v.co.y
        place = Matrix.Rotation(angle, 4, "Z") @ Matrix.Translation((radius, 0, lift)) @ Matrix.Rotation(-math.radians(tilt), 4, "Y")
        bmesh.ops.transform(bm, matrix=FLOWER_AXIS @ place, verts=verts)
    to_object(f"Cempasuchil{index}", bm, PETALO[index], sharp_angle=0)
bm = bmesh.new()
verts = add_sphere(bm, 0.1, (1, 1, 0.7), Matrix.Translation((0, 0, 0.3)), u=10, v=6)
bmesh.ops.transform(bm, matrix=FLOWER_AXIS, verts=verts)
to_object("CempasuchilCentro", bm, PETALO[4], sharp_angle=0)

# Hojas detrás de la flor.
bm = bmesh.new()
for pos, rot_z, rot_y, size in (((0.95, 0.25, 1.42), 22, -18, 1.0), ((-0.32, 0.2, 0.3), 196, -8, 0.9), ((0.98, 0.3, 0.92), -12, 6, 0.8)):
    verts = add_sphere(bm, 1.0, (0.52 * size, 0.2 * size, 0.035), Matrix.Identity(4), u=10, v=6)
    for v in verts:  # hoja apuntada con nervio central
        v.co.y *= 1 - 0.75 * (v.co.x / (0.52 * size)) ** 2 * (0.5 if v.co.x < 0 else 1)
        v.co.z += 0.12 * abs(v.co.y)
    m = Matrix.Translation(pos) @ Matrix.Rotation(math.radians(rot_z), 4, "Z") @ Matrix.Rotation(math.radians(rot_y), 4, "Y")
    bmesh.ops.transform(bm, matrix=m, verts=verts)
to_object("Hojas", bm, HOJA)

# ── Calabaza con gajos ──
P_CENTER = Vector((1.04, -0.8, 0.5))
P_R, P_RIBS, P_AMP, P_SQUASH = 0.62, 10, 0.085, 0.8


def pumpkin_radius(direction):
    s = math.hypot(direction.x, direction.y)
    return P_R * (1 + P_AMP * math.cos(P_RIBS * math.atan2(direction.y, direction.x)) * s)


bm = bmesh.new()
geo = bmesh.ops.create_uvsphere(bm, u_segments=40, v_segments=18, radius=1.0)
for v in geo["verts"]:
    d = v.co.normalized()
    r = pumpkin_radius(d)
    dent = 0.1 * math.exp(-(d.x * d.x + d.y * d.y) / 0.05) * (1 if d.z > 0 else 0.5)
    v.co = Vector((d.x * r, d.y * r, d.z * r * P_SQUASH - math.copysign(dent, d.z)))
calabaza = to_object("Calabaza", bm, CALABAZA, sharp_angle=0)
calabaza.location = P_CENTER

bm = bmesh.new()
geo = bmesh.ops.create_cone(bm, cap_ends=True, segments=8, radius1=0.085, radius2=0.05, depth=0.3, matrix=Matrix.Translation((0, 0, 0.15)))
for v in geo["verts"]:
    v.co.x += 0.35 * v.co.z ** 2 * 3
tallo = to_object("Tallo", bm, TALLO)
tallo.location = P_CENTER + Vector((0, 0, P_R * P_SQUASH - 0.1))


def on_pumpkin(x, z, lift=0.03):
    """Punto de la superficie con gajos en la cara frontal (−Y) para un (x, z) dado."""
    r = P_R
    for _ in range(8):
        dx, dz = x / r, z / (P_SQUASH * r)
        dy = -math.sqrt(max(1e-6, 1 - dx * dx - dz * dz))
        r = pumpkin_radius(Vector((dx, dy, dz)))
    direction = Vector((dx, dy, dz)).normalized()
    return Vector((x, dy * r, z)) + direction * lift


EYE = [(-0.31, 0.06), (-0.08, 0.06), (-0.195, 0.26)]
SHAPES = [EYE, [(-x, z) for x, z in reversed(EYE)], [(-0.055, -0.045), (0.055, -0.045), (0, 0.05)],
          [(-0.36, -0.1), (-0.24, -0.17), (-0.12, -0.11), (0, -0.18), (0.12, -0.11), (0.24, -0.17), (0.36, -0.1),
           (0.28, -0.23), (0.15, -0.3), (0, -0.325), (-0.15, -0.3), (-0.28, -0.23)]]
bm = bmesh.new()
for shape in SHAPES:
    verts = [bm.verts.new((x, 0, z)) for x, z in shape]
    bm.faces.new(verts)
bmesh.ops.triangulate(bm, faces=bm.faces[:])
bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=3, use_grid_fill=True)
bmesh.ops.triangulate(bm, faces=bm.faces[:])
bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, use_grid_fill=True)
for v in bm.verts:
    v.co = on_pumpkin(v.co.x, v.co.z)
cara = to_object("CalabazaCara", bm, CARA, sharp_angle=0)
cara.location = P_CENTER

# ── Pétalos caídos ──
bm = bmesh.new()
for pos, rot, size in (((-1.42, -0.62, 0.035), 20, 0.95), ((-1.0, -1.02, 0.03), -35, 0.8), ((0.0, -1.2, 0.03), 60, 0.7)):
    verts = add_sphere(bm, 1.0, (0.3 * size, 0.17 * size, 0.03), Matrix.Identity(4), u=8, v=6)
    for v in verts:
        v.co.z += 0.5 * v.co.x * abs(v.co.x)
    bmesh.ops.transform(bm, matrix=Matrix.Translation(pos) @ Matrix.Rotation(math.radians(rot), 4, "Z"), verts=verts)
to_object("PetalosCaidos", bm, PETALO[2], sharp_angle=0)

# ── Exportación ──
triangles = sum(len(p.vertices) - 2 for o in bpy.data.objects if o.type == "MESH" for p in o.data.polygons)
print(f"ESCENA: {len(bpy.data.objects)} objetos, {triangles} triángulos, {len(bpy.data.materials)} materiales")
bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format="GLB", export_apply=True, export_yup=True,
    export_cameras=False, export_lights=False, export_animations=False,
    export_texcoords=False, export_normals=True, export_materials="EXPORT",
)
print("EXPORTADO", OUT)
