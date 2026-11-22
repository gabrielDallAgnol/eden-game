"""Eden art test D: low-poly cottage rendered as 2:1 isometric pixel art.

Run:  blender -b -P scripts/blender_cottage.py
Out:  out/blender_cottage.blend, out/blender_cottage_raw.png (96x96, transparent)

Scale: 1 Blender unit = one ground tile edge. A tile is 64x32 px on screen,
so the ortho camera shows 96/64*sqrt(2) units across a 96 px canvas.
Shading is "baked toon": every face gets one of three flat emission colours
picked from its normal vs. a light coming from the upper left of the screen.
No lights, no anti-aliasing, so the render is already hard-edged pixels.
"""
import bpy, bmesh, math, os
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "out")
CANVAS = 96
PX_PER_TILE = 64

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# to-light direction: screen-left is (-1,-1,0) in world, plus up
LIGHT = Vector((-0.45, -0.85, 0.95)).normalized()


def srgb_to_lin(c):
    return tuple(((v / 12.92) if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4) for v in c)


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


_mats = {}


def flat_mat(rgb):
    key = tuple(round(v, 4) for v in rgb)
    if key in _mats:
        return _mats[key]
    m = bpy.data.materials.new("flat_%02x%02x%02x" % tuple(int(v * 255) for v in rgb))
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = (*srgb_to_lin(rgb), 1)
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(em.outputs[0], out.inputs["Surface"])
    _mats[key] = m
    return m


def shades(base):
    """light / mid / shadow. Shadows shift toward cool purple, lights toward warm."""
    r, g, b = base
    light = (min(1, r * 1.16 + 0.03), min(1, g * 1.14 + 0.03), min(1, b * 1.04))
    dark = (r * 0.62, g * 0.60, b * 0.74)
    return [light, base, dark]


def add_mesh(name, verts, faces, colour):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    for s in shades(hexrgb(colour)):
        mesh.materials.append(flat_mat(s))
    for p in mesh.polygons:
        d = p.normal.dot(LIGHT)
        p.material_index = 0 if d > 0.62 else (1 if d > 0.15 else 2)
    return obj


def box(name, c, s, colour):
    cx, cy, cz = c
    hx, hy, hz = s[0] / 2, s[1] / 2, s[2] / 2
    v = [(cx + dx * hx, cy + dy * hy, cz + dz * hz)
         for dz in (-1, 1) for dy in (-1, 1) for dx in (-1, 1)]
    f = [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]
    return add_mesh(name, v, f, colour)


def gable(name, x0, x1, hy, z0, z1, colour):
    """Triangular prism, ridge along X."""
    v = [(x0, -hy, z0), (x0, hy, z0), (x0, 0, z1), (x1, -hy, z0), (x1, hy, z0), (x1, 0, z1)]
    f = [(0, 2, 1), (3, 4, 5), (0, 3, 5, 2), (1, 2, 5, 4), (0, 1, 4, 3)]
    return add_mesh(name, v, f, colour)


def slope(name, x0, x1, y_eave, y_ridge, z_eave, z_ridge, t, colour):
    """Thin roof slab from eave to ridge, thickness t (vertical)."""
    v = [(x0, y_eave, z_eave), (x1, y_eave, z_eave), (x1, y_ridge, z_ridge), (x0, y_ridge, z_ridge),
         (x0, y_eave, z_eave + t), (x1, y_eave, z_eave + t), (x1, y_ridge, z_ridge + t), (x0, y_ridge, z_ridge + t)]
    f = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    return add_mesh(name, v, f, colour)


# ---- palette (cozy, close to the reference; final colours get snapped later) ----
STONE, TIMBER, BEAM, PLASTER = "#8a8f96", "#a8553a", "#5a2a2e", "#d98a48"
TEAL, TEAL_TRIM, DOOR, GLASS, DECK = "#59ac9d", "#86cdb0", "#6a9a4a", "#f0dca0", "#b8804e"
TEAL_DARK = "#3f8f8a"

# ---- model (units = tiles; footprint about 1.2 x 1.0) ----
WX, WY, WZ = 1.00, 0.80, 0.52          # wall block
Z0 = 0.10                               # top of foundation
box("foundation", (0, 0, Z0 / 2), (WX + 0.10, WY + 0.10, Z0), STONE)
box("walls", (0, 0, Z0 + WZ / 2), (WX, WY, WZ), PLASTER)
# timber frame
for sx in (-1, 1):
    for sy in (-1, 1):
        box("post", (sx * WX / 2, sy * WY / 2, Z0 + WZ / 2), (0.07, 0.07, WZ), BEAM)
box("sill_f", (0, -WY / 2, Z0 + 0.03), (WX, 0.05, 0.06), BEAM)
box("sill_r", (WX / 2, 0, Z0 + 0.03), (0.05, WY, 0.06), BEAM)
box("plate_f", (0, -WY / 2, Z0 + WZ - 0.03), (WX, 0.05, 0.06), BEAM)
box("plate_r", (WX / 2, 0, Z0 + WZ - 0.03), (0.05, WY, 0.06), BEAM)
# lower wall cladding in timber
box("clad_f", (0, -WY / 2 - 0.005, Z0 + 0.12), (WX - 0.07, 0.03, 0.18), TIMBER)
box("clad_r", (WX / 2 + 0.005, 0, Z0 + 0.12), (0.03, WY - 0.07, 0.18), TIMBER)

# gable + roof (ridge along X so the teal slope faces the light)
RZ0, RZ1 = Z0 + WZ, Z0 + WZ + 0.46
gable("gable", -WX / 2, WX / 2, WY / 2, RZ0, RZ1, PLASTER)
box("gable_beam", (WX / 2 + 0.005, 0, RZ0 + 0.16), (0.03, 0.05, 0.32), BEAM)
OH = 0.12                               # overhang
k = (RZ1 - RZ0) / (WY / 2)
for sy in (-1, 1):
    slope("roof", -WX / 2 - OH, WX / 2 + OH, sy * (WY / 2 + OH), 0,
          RZ0 - k * OH + 0.02, RZ1 + 0.02, 0.07, TEAL)
box("ridge", (0, 0, RZ1 + 0.08), (WX + 2 * OH + 0.02, 0.07, 0.06), TEAL_TRIM)
box("chimney", (-0.22, 0.14, RZ1 - 0.02), (0.14, 0.14, 0.42), STONE)
box("chimney_cap", (-0.22, 0.14, RZ1 + 0.20), (0.18, 0.18, 0.04), BEAM)

# door + windows
box("door", (0.22, -WY / 2 - 0.01, Z0 + 0.17), (0.18, 0.03, 0.34), DOOR)
box("win_f", (-0.22, -WY / 2 - 0.01, Z0 + 0.32), (0.20, 0.03, 0.16), GLASS)
box("win_f_bar", (-0.22, -WY / 2 - 0.02, Z0 + 0.32), (0.025, 0.03, 0.16), BEAM)
box("win_r", (WX / 2 + 0.01, 0, Z0 + 0.32), (0.03, 0.22, 0.16), GLASS)
box("win_r_bar", (WX / 2 + 0.02, 0, Z0 + 0.32), (0.03, 0.025, 0.16), BEAM)
box("win_g", (WX / 2 + 0.01, 0, RZ0 + 0.14), (0.03, 0.10, 0.10), GLASS)

# tile-row highlights on the lit roof slope (thin slabs just above it)
for f in (0.34, 0.67):
    y_a = -(WY / 2 + OH) * (1 - f)
    z_a = (RZ0 - k * OH + 0.02) + f * ((RZ1 + 0.02) - (RZ0 - k * OH + 0.02)) + 0.071
    slope("tile_row", -WX / 2 - OH, WX / 2 + OH, y_a, y_a + 0.035, z_a, z_a + 0.035 * k, 0.004, TEAL_TRIM)

# porch on the lit (front-left) side: full-width deck, small roof over the door only
PD = 0.30
py = -WY / 2 - PD / 2
box("porch_deck", (0, py, 0.04), (WX + 0.10, PD, 0.08), DECK)
box("porch_step", (0.22, py - PD / 2 - 0.05, 0.02), (0.24, 0.10, 0.04), DECK)
for x in (0.02, 0.50):
    box("porch_post", (x, -WY / 2 - PD + 0.04, 0.08 + 0.20), (0.05, 0.05, 0.40), BEAM)
slope("porch_roof", -0.03, 0.56, -WY / 2 - PD - 0.03, -WY / 2 + 0.02, 0.46, 0.58, 0.05, TEAL_DARK)
# railing along the open part of the deck
box("rail_top", (-0.27, -WY / 2 - PD + 0.04, 0.08 + 0.14), (0.54, 0.03, 0.03), BEAM)
for x in (-0.52, -0.39, -0.26, -0.13):
    box("rail_post", (x, -WY / 2 - PD + 0.04, 0.08 + 0.07), (0.03, 0.03, 0.14), BEAM)

# ---- camera: orthographic, 2:1 dimetric (30 deg elevation, 45 deg yaw) ----
cam_data = bpy.data.cameras.new("IsoCam")
cam_data.type = "ORTHO"
cam_data.ortho_scale = CANVAS / PX_PER_TILE * math.sqrt(2)
cam = bpy.data.objects.new("IsoCam", cam_data)
scene.collection.objects.link(cam)
cam.rotation_euler = (math.radians(60), 0, math.radians(45))
target = Vector((0.0, -0.10, 0.50))
cam.location = target + Vector((0.6124, -0.6124, 0.5)) * 10
scene.camera = cam

# ---- render: flat, aliased, transparent ----
for eng in ("BLENDER_EEVEE", "BLENDER_EEVEE_NEXT"):
    try:
        scene.render.engine = eng
        break
    except TypeError:
        pass
r = scene.render
r.resolution_x = r.resolution_y = CANVAS
r.resolution_percentage = 100
r.film_transparent = True
r.filter_size = 0.01
r.dither_intensity = 0.0
try:
    scene.eevee.taa_render_samples = 1
except Exception:
    pass
scene.view_settings.view_transform = "Standard"
try:
    scene.view_settings.look = "None"
except Exception:
    pass
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGBA"
r.filepath = os.path.join(OUT, "blender_cottage_raw.png")

bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "blender_cottage.blend"))
bpy.ops.render.render(write_still=True)
print("RENDERED", r.filepath, "engine", scene.render.engine)
