import bpy
import os
from mathutils import Vector


# -------------------------
# Config
# -------------------------
# Change if needed
EXPORT_PATH = r"F:\Game Development\Random Buildings\apps\web\public\models"


# -------------------------
# Scene cleanup
# -------------------------
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def safe_principled_inputs(bsdf):
    names = {i.name: i for i in bsdf.inputs}
    return names


def create_material(name, color, metallic=0.0, roughness=0.8, emission_color=None, emission_strength=5.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        pins = safe_principled_inputs(bsdf)
        if "Base Color" in pins:
            pins["Base Color"].default_value = color
        if "Metallic" in pins:
            pins["Metallic"].default_value = metallic
        if "Roughness" in pins:
            pins["Roughness"].default_value = roughness

        # Blender version-safe emission handling
        if emission_color is not None:
            if "Emission Color" in pins:
                pins["Emission Color"].default_value = emission_color
            elif "Emission" in pins:
                pins["Emission"].default_value = emission_color
            if "Emission Strength" in pins:
                pins["Emission Strength"].default_value = emission_strength
    return mat


def ensure_obj_mode():
    if bpy.context.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")


def apply_transforms_and_uv(obj):
    ensure_obj_mode()
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.uv.smart_project()
    bpy.ops.object.mode_set(mode="OBJECT")
    obj.select_set(False)


def join_objects(name, objects):
    ensure_obj_mode()
    bpy.ops.object.select_all(action="DESELECT")
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    joined = bpy.context.active_object
    joined.name = name
    return joined


def set_origin_world(obj, world_xyz):
    ensure_obj_mode()
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.context.scene.cursor.location = world_xyz
    bpy.ops.object.origin_set(type="ORIGIN_CURSOR")
    obj.select_set(False)


def export_selected_glb(obj, filepath):
    ensure_obj_mode()
    bpy.ops.object.select_all(action="DESELECT")
    original_loc = obj.location.copy()
    obj.location = Vector((0.0, 0.0, 0.0))
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format="GLB",
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_animations=False,
    )
    obj.location = original_loc
    obj.select_set(False)


os.makedirs(EXPORT_PATH, exist_ok=True)


# -------------------------
# Materials
# -------------------------
mat_dark_plastic = create_material("DarkPlastic", (0.05, 0.05, 0.05, 1.0), roughness=0.6)
mat_screen = create_material("Screen", (0.01, 0.01, 0.01, 1.0), roughness=0.2)
mat_wood = create_material("Wood", (0.40, 0.22, 0.08, 1.0), roughness=0.85)
mat_metal = create_material("Metal", (0.8, 0.8, 0.8, 1.0), metallic=1.0, roughness=0.3)
mat_lamp_base = create_material("LampBase", (0.2, 0.5, 0.8, 1.0), roughness=0.7)
mat_lampshade = create_material("LampShade", (0.9, 0.9, 0.8, 1.0), roughness=0.9)
mat_emissive = create_material("EmissiveBulb", (1.0, 0.9, 0.5, 1.0), emission_color=(1.0, 0.9, 0.5, 1.0))
mat_stove_body = create_material("StoveBody", (0.8, 0.8, 0.8, 1.0), roughness=0.5)
mat_burner_emissive = create_material("BurnerEmissive", (1.0, 0.2, 0.0, 1.0), emission_color=(1.0, 0.2, 0.0, 1.0))


# -------------------------
# 1) TV  (about 0.9m wide)
# origin: bottom center at world 0,0,0
# -------------------------
bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.325))
tv_body = bpy.context.active_object
tv_body.scale = (0.45, 0.06, 0.275)  # final dims: 0.9 x 0.12 x 0.55
tv_body.data.materials.append(mat_dark_plastic)

bpy.ops.mesh.primitive_cube_add(location=(0, -0.035, 0.325))
tv_screen = bpy.context.active_object
tv_screen.scale = (0.41, 0.008, 0.24)  # inset panel
tv_screen.data.materials.append(mat_screen)

bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.05))
tv_stand = bpy.context.active_object
tv_stand.scale = (0.12, 0.10, 0.05)  # final dims: 0.24 x 0.2 x 0.1
tv_stand.data.materials.append(mat_dark_plastic)

tv = join_objects("TV", [tv_body, tv_screen, tv_stand])
set_origin_world(tv, (0.0, 0.0, 0.0))
apply_transforms_and_uv(tv)


# -------------------------
# 2) Door (0.9w x 2h)
# origin: hinge bottom at world 0,0,0
# -------------------------
bpy.ops.mesh.primitive_cube_add(location=(0.45, 0.0, 1.0))
door_slab = bpy.context.active_object
door_slab.scale = (0.45, 0.04, 1.0)  # final dims: 0.9 x 0.08 x 2.0
door_slab.data.materials.append(mat_wood)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.05, location=(0.78, -0.055, 1.0))
door_handle = bpy.context.active_object
door_handle.data.materials.append(mat_metal)

door = join_objects("Door", [door_slab, door_handle])
set_origin_world(door, (0.0, 0.0, 0.0))
apply_transforms_and_uv(door)


# -------------------------
# 3) Lamp (~1.2m tall)
# origin: bottom center at world 0,0,0
# -------------------------
bpy.ops.mesh.primitive_cylinder_add(radius=0.15, depth=0.05, location=(0, 0, 0.025))
lamp_base = bpy.context.active_object
lamp_base.data.materials.append(mat_lamp_base)

bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.95, location=(0, 0, 0.525))
lamp_pole = bpy.context.active_object
lamp_pole.data.materials.append(mat_lamp_base)

bpy.ops.mesh.primitive_cone_add(radius1=0.20, radius2=0.05, depth=0.28, location=(0, 0, 1.04))
lamp_shade = bpy.context.active_object
lamp_shade.data.materials.append(mat_lampshade)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.05, location=(0, 0, 0.94))
lamp_bulb = bpy.context.active_object
lamp_bulb.data.materials.append(mat_emissive)

lamp = join_objects("Lamp", [lamp_base, lamp_pole, lamp_shade, lamp_bulb])
set_origin_world(lamp, (0.0, 0.0, 0.0))
apply_transforms_and_uv(lamp)


# -------------------------
# 4) Stove (0.9 x 0.9 x 0.8)
# origin: bottom center at world 0,0,0
# -------------------------
bpy.ops.mesh.primitive_cube_add(location=(0, 0, 0.4))
stove_body = bpy.context.active_object
stove_body.scale = (0.45, 0.45, 0.4)  # final dims: 0.9 x 0.9 x 0.8
stove_body.data.materials.append(mat_stove_body)

bpy.ops.mesh.primitive_cube_add(location=(0, -0.44, 0.34))
stove_door = bpy.context.active_object
stove_door.scale = (0.30, 0.01, 0.22)
stove_door.data.materials.append(mat_dark_plastic)

burners = []
for px, py in [(-0.20, -0.20), (0.20, -0.20), (-0.20, 0.20), (0.20, 0.20)]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.02, location=(px, py, 0.81))
    b = bpy.context.active_object
    b.data.materials.append(mat_burner_emissive)
    burners.append(b)

stove = join_objects("Stove", [stove_body, stove_door, *burners])
set_origin_world(stove, (0.0, 0.0, 0.0))
apply_transforms_and_uv(stove)


# Keep separated in viewport for inspection
door.location.x = 1.7
lamp.location.x = 3.4
stove.location.x = 5.1


# Export all
for obj_name in ["TV", "Door", "Lamp", "Stove"]:
    obj = bpy.data.objects[obj_name]
    out_file = os.path.join(EXPORT_PATH, f"{obj_name.lower()}.glb")
    export_selected_glb(obj, out_file)

print(f"Export complete. Files saved in: {EXPORT_PATH}")

