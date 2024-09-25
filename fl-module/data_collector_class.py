# Code based on Carla examples, which are authored by
# Computer Vision Center (CVC) at the Universitat Autonoma de Barcelona (UAB).

# How to run:
# Start a Carla simulation
# cd into the parent directory of the 'code' directory and run
# python -m code.solutions.lane_detection.collect_data

from glob import glob
import os
import shutil
import carla
import random
import pygame
import numpy as np
import cv2
from datetime import datetime
import sys
import argparse

import matplotlib.pyplot as plt

from util.carla_util import (
    carla_vec_to_np_array,
    CarlaSyncMode,
    find_weather_presets,
    draw_image,
    should_quit,
)
from camera_geometry import (
    get_intrinsic_matrix,
    project_polyline,
    CameraGeometry,
)
from util.seg_data_util import SEG_DATA_FOLDER, mkdir_if_not_exist




# ==============================================================================
# -- World ---------------------------------------------------------------------
# ==============================================================================


class World(object):
    def __init__(self, carla_world):
        self.world = carla_world
        # self.hud = hud
        self.player = None
        self.collision_sensor = None
        self.lane_invasion_sensor = None
        self.gnss_sensor = None
        self.camera_manager = None
        self._weather_presets = find_weather_presets()
        self._weather_index = 0
        # self._actor_filter = actor_filter
        # self.restart()
        # self.world.on_tick(hud.on_world_tick)

    def restart(self):
        # Keep same camera config if the camera manager exists.
        cam_index = self.camera_manager.index if self.camera_manager is not None else 0
        cam_pos_index = self.camera_manager.transform_index if self.camera_manager is not None else 0
        # Get a random blueprint.
        # blueprint = random.choice(self.world.get_blueprint_library().filter(self._actor_filter))
        # blueprint.set_attribute('role_name', 'hero')
        # if blueprint.has_attribute('color'):
        #     color = random.choice(blueprint.get_attribute('color').recommended_values)
        #     blueprint.set_attribute('color', color)
        # # Spawn the player.
        # if self.player is not None:
        #     spawn_point = self.player.get_transform()
        #     spawn_point.location.z += 2.0
        #     spawn_point.rotation.roll = 0.0
        #     spawn_point.rotation.pitch = 0.0
        #     self.destroy()
        #     self.player = self.world.try_spawn_actor(blueprint, spawn_point)
        # while self.player is None:
        #     spawn_points = self.world.get_map().get_spawn_points()
        #     spawn_point = random.choice(spawn_points) if spawn_points else carla.Transform()
        #     self.player = self.world.try_spawn_actor(blueprint, spawn_point)
        # Set up the sensors.
        # self.collision_sensor = CollisionSensor(self.player, self.hud)
        # self.lane_invasion_sensor = LaneInvasionSensor(self.player, self.hud)
        # self.gnss_sensor = GnssSensor(self.player)
        # self.camera_manager = CameraManager(self.player, self.hud)
        # self.camera_manager.transform_index = cam_pos_index
        # self.camera_manager.set_sensor(cam_index, notify=False)
        # actor_type = get_actor_display_name(self.player)
        # self.hud.notification(actor_type)

    def next_weather(self, reverse=False):
        self._weather_index += -1 if reverse else 1
        self._weather_index %= len(self._weather_presets)
        preset = self._weather_presets[self._weather_index]
        self.hud.notification('Weather: %s' % preset[1])
        self.player.get_world().set_weather(preset[0])

    def tick(self, clock):
        self.hud.tick(self, clock)

    def render(self, display):
        self.camera_manager.render(display)
        self.hud.render(display)

    def destroy(self):
        sensors = [
            self.camera_manager.sensor,
            self.collision_sensor.sensor,
            self.lane_invasion_sensor.sensor,
            self.gnss_sensor.sensor]
        for sensor in sensors:
            if sensor is not None:
                sensor.stop()
                sensor.destroy()
        if self.player is not None:
            self.player.destroy()


class collector():
    
    def __init__(self, weather_name = "ClearSunset", map_name = "Town10HD", store_file_number = 10 ) -> None:
        print(weather_name, map_name, store_file_number)
        self.weather_name = weather_name
        self.map = map_name
        self.store_file_number = store_file_number
        self.store_files = True
        self.town_string = "Town05"
        self.cg = CameraGeometry()
        self.width = self.cg.image_width
        self.height = self.cg.image_height
        now = datetime.now()
        self.date_time_string = now.strftime("%m_%d_%Y_%H_%M_%S")
        self.pid = os.getpid()
        self.data_folder = os.path.join(f"{self.pid}_data")

    def sort_collected_data(self, SEG_DATA_FOLDER):
        
        """ Copy and sort content of 'data' folder into 'data_lane_segmentation' folder  """

        def is_from_valid_set(fn):
            return fn.find("validation") != -1

        x_train_dir = f"./{SEG_DATA_FOLDER}/train"
        y_train_dir = f"./{SEG_DATA_FOLDER}/train_label"
        x_valid_dir = f"./{SEG_DATA_FOLDER}/val"
        y_valid_dir = f"./{SEG_DATA_FOLDER}/val_label"

        for direc in [x_train_dir, y_train_dir, x_valid_dir, y_valid_dir]:
            mkdir_if_not_exist(direc)

        images = [x for x in os.listdir(f"./{SEG_DATA_FOLDER}") if x.find("png") >= 0]
        inputs = [x for x in images if x.find("label") == -1]
        labels = [x for x in images if x.find("label") != -1]

        train_x = [x for x in inputs if not is_from_valid_set(x)]
        valid_x = [x for x in inputs if is_from_valid_set(x)]
        train_y = [x for x in labels if not is_from_valid_set(x)]
        valid_y = [x for x in labels if is_from_valid_set(x)]

        for f in train_x:
            shutil.copyfile(os.path.join(f"{SEG_DATA_FOLDER}", f), os.path.join(x_train_dir, f))

        for f in train_y:
            shutil.copyfile(os.path.join(f"{SEG_DATA_FOLDER}", f), os.path.join(y_train_dir, f))

        for f in valid_x:
            shutil.copyfile(os.path.join(f"{SEG_DATA_FOLDER}", f), os.path.join(x_valid_dir, f))

        for f in valid_y:
            shutil.copyfile(os.path.join(f"{SEG_DATA_FOLDER}", f), os.path.join(y_valid_dir, f))

        [os.remove(f) for f in glob(f"{SEG_DATA_FOLDER}/*.png")]
        [os.remove(f) for f in glob(f"{SEG_DATA_FOLDER}/*.txt")]
        
    def plot_map(self, m):

        wp_list = m.generate_waypoints(2.0)
        loc_list = np.array(
            [carla_vec_to_np_array(wp.transform.location) for wp in wp_list]
        )
        plt.scatter(loc_list[:, 0], loc_list[:, 1])
        plt.show()

    def random_transform_disturbance(self, transform):
        lateral_noise = np.random.normal(0, 0.3)
        lateral_noise = np.clip(lateral_noise, -0.3, 0.3)

        lateral_direction = transform.get_right_vector()
        x = transform.location.x + lateral_noise * lateral_direction.x
        y = transform.location.y + lateral_noise * lateral_direction.y
        z = transform.location.z + lateral_noise * lateral_direction.z

        yaw_noise = np.random.normal(0, 5)
        yaw_noise = np.clip(yaw_noise, -10, 10)

        pitch = transform.rotation.pitch
        yaw = transform.rotation.yaw + yaw_noise
        roll = transform.rotation.roll

        return carla.Transform(
            carla.Location(x, y, z), carla.Rotation(pitch, yaw, roll)
        )

    def get_curvature(self, polyline): 
        dx_dt = np.gradient(polyline[:, 0])
        dy_dt = np.gradient(polyline[:, 1])
        d2x_dt2 = np.gradient(dx_dt)
        d2y_dt2 = np.gradient(dy_dt)
        curvature = (
            np.abs(d2x_dt2 * dy_dt - dx_dt * d2y_dt2)
            / (dx_dt * dx_dt + dy_dt * dy_dt) ** 1.5
        )
        # print(curvature)
        return np.max(curvature)

    def create_lane_lines(
        self, world_map, vehicle, exclude_junctions=True, only_turns=False
    ):
        waypoint = world_map.get_waypoint(
            vehicle.get_transform().location,
            project_to_road=True,
            lane_type=carla.LaneType.Driving,
        )
        # print(str(waypoint.right_lane_marking.type))
        center_list, left_boundary, right_boundary = [], [], []
        for _ in range(60):
            if (
                str(waypoint.right_lane_marking.type)
                + str(waypoint.left_lane_marking.type)
            ).find("NONE") != -1:
                return None, None, None
            # if there is a junction on the path, return None
            if exclude_junctions and waypoint.is_junction:
                return None, None, None
            next_waypoints = waypoint.next(1.0)
            # if there is a branch on the path, return None
            if len(next_waypoints) != 1:
                return None, None, None
            waypoint = next_waypoints[0]
            center = carla_vec_to_np_array(waypoint.transform.location)
            center_list.append(center)
            offset = (
                carla_vec_to_np_array(waypoint.transform.get_right_vector())
                * waypoint.lane_width
                / 2.0
            )
            left_boundary.append(center - offset)
            right_boundary.append(center + offset)

        max_curvature = self.get_curvature(np.array(center_list))
        if max_curvature > 0.005:
            return None, None, None

        if only_turns and max_curvature < 0.002:
            return None, None, None

        return (
            np.array(center_list),
            np.array(left_boundary),
            np.array(right_boundary),
        )

    def check_inside_image(self, pixel_array, width, height):
        ok = (0 < pixel_array[:, 0]) & (pixel_array[:, 0] < width)
        ok = ok & (0 < pixel_array[:, 1]) & (pixel_array[:, 1] < height)
        ratio = np.sum(ok) / len(pixel_array)
        return ratio > 0.5

    def carla_img_to_array(self, image):
        array = np.frombuffer(image.raw_data, dtype=np.dtype("uint8"))
        array = np.reshape(array, (image.height, image.width, 4))
        array = array[:, :, :3]
        array = array[:, :, ::-1]
        return array

    def save_img(self, image, path, raw=False):
        array = self.carla_img_to_array(image)
        if raw:
            np.save(path, array)
        else:
            cv2.imwrite(path, array)

    def save_label_img(self, lb_left, lb_right, path):
        label = np.zeros((self.height, self.width, 3))
        colors = [[1, 1, 1], [2, 2, 2]]
        for color, lb in zip(colors, [lb_left, lb_right]):
            cv2.polylines(
                label, np.int32([lb]), isClosed=False, color=color, thickness=5
            )
        label = np.mean(label, axis=2)  # collapse color channels to get gray scale
        cv2.imwrite(path, label)

    def get_random_spawn_point(self, m):
        pose = random.choice(m.get_spawn_points())
        return m.get_waypoint(pose.location)

    def main(self):

        world = None

        mkdir_if_not_exist(self.data_folder)
        actor_list = []
        pygame.init()
        display = pygame.display.set_mode(
            (self.width, self.height), pygame.HWSURFACE | pygame.DOUBLEBUF
        )
        font = pygame.font.SysFont("monospace", 12)
        clock = pygame.time.Clock()
        
        client = carla.Client("localhost", 2000)
        client.set_timeout(60.0)

        # client.load_world(self.town_string)
        world = client.get_world()
        # world = World(client.get_world()).world
        # hud = HUD(args.width, args.height)
        # world = World(client.get_world(), hud, args.filter)

        
        try:
            world = client.load_world(self.map)
            m = world.get_map()
            print(m)
            # plot_map(m)
            start_pose = random.choice(m.get_spawn_points())
            spawn_waypoint = m.get_waypoint(start_pose.location)


            # set weather to sunny
            # weather_preset, weather_preset_str = find_weather_presets()[0]
            # weather_preset_str = weather_preset_str.replace(" ", "_")
                        
            world.set_weather(getattr(carla.WeatherParameters, self.weather_name))        
            
            simulation_identifier = (
                self.town_string + "_" + self.weather_name + "_" + self.date_time_string
            )

            # create a vehicle
            blueprint_library = world.get_blueprint_library()

            vehicle = world.spawn_actor(
                random.choice(blueprint_library.filter("vehicle.audi.tt")),
                start_pose,
            )
            actor_list.append(vehicle)
            vehicle.set_simulate_physics(False)

            # create camera and attach to vehicle
            cam_rgb_transform = carla.Transform(
                carla.Location(x=0.5, z=self.cg.height),
                carla.Rotation(pitch=self.cg.pitch_deg),
            )
            trafo_matrix_vehicle_to_cam = np.array(
                cam_rgb_transform.get_inverse_matrix()
            )
            bp = blueprint_library.find("sensor.camera.rgb")
            fov = self.cg.field_of_view_deg
            bp.set_attribute("image_size_x", str(self.width))
            bp.set_attribute("image_size_y", str(self.height))
            bp.set_attribute("fov", str(fov))
            camera_rgb = world.spawn_actor(
                bp, cam_rgb_transform, attach_to=vehicle
            )
            actor_list.append(camera_rgb)

            K = get_intrinsic_matrix(fov, self.width, self.height)
            min_jump, max_jump = 5, 10
            
            save_count = 0

            # Create a synchronous mode context.
            with CarlaSyncMode(World(client.get_world()).world, camera_rgb, fps=30) as sync_mode:
                frame = 0
                while True:
                    if should_quit():
                        return
                    clock.tick()

                    # Advance the simulation and wait for the data.
                    snapshot, image_rgb = sync_mode.tick(timeout=2.0)

                    # Choose the next spawn_waypoint and update the car location.
                    # ----- change lane with low probability
                    if np.random.rand() > 0.9:
                        shifted = None
                        if spawn_waypoint.lane_change == carla.LaneChange.Left:
                            shifted = spawn_waypoint.get_left_lane()
                        elif spawn_waypoint.lane_change == carla.LaneChange.Right:
                            shifted = spawn_waypoint.get_right_lane()
                        elif spawn_waypoint.lane_change == carla.LaneChange.Both:
                            if np.random.rand() > 0.5:
                                shifted = spawn_waypoint.get_right_lane()
                            else:
                                shifted = spawn_waypoint.get_left_lane()
                        if shifted is not None:
                            spawn_waypoint = shifted
                    # ----- jump forwards a random distance
                    jump = np.random.uniform(min_jump, max_jump)
                    next_waypoints = spawn_waypoint.next(jump)
                    if not next_waypoints:
                        spawn_waypoint = self.get_random_spawn_point(m)
                    else:
                        spawn_waypoint = random.choice(next_waypoints)

                    # ----- randomly change yaw and lateral position
                    spawn_transform = self.random_transform_disturbance(
                        spawn_waypoint.transform
                    )
                    vehicle.set_transform(spawn_transform)

                    # Draw the display.
                    fps = round(1.0 / snapshot.timestamp.delta_seconds)

                    draw_image(display, image_rgb)
                    display.blit(
                        font.render(
                            "% 5d FPS (real)" % clock.get_fps(),
                            True,
                            (255, 255, 255),
                        ),
                        (8, 10),
                    )
                    display.blit(
                        font.render(
                            "% 5d FPS (simulated)" % fps, True, (255, 255, 255)
                        ),
                        (8, 28),
                    )

                    # draw lane boundaries as augmented reality
                    trafo_matrix_world_to_vehicle = np.array(
                        vehicle.get_transform().get_inverse_matrix()
                    )
                    trafo_matrix_global_to_camera = (
                        trafo_matrix_vehicle_to_cam @ trafo_matrix_world_to_vehicle
                    )
                    mat_swap_axes = np.array(
                        [[0, 1, 0, 0], [0, 0, -1, 0], [1, 0, 0, 0], [0, 0, 0, 1]]
                    )
                    trafo_matrix_global_to_camera = (
                        mat_swap_axes @ trafo_matrix_global_to_camera
                    )

                    center_list, left_boundary, right_boundary = self.create_lane_lines(
                        m, vehicle
                    )
                    if center_list is None:
                        spawn_waypoint = self.get_random_spawn_point(m)
                        continue

                    projected_center = project_polyline(
                        center_list, trafo_matrix_global_to_camera, K
                    ).astype(np.int32)
                    projected_left_boundary = project_polyline(
                        left_boundary, trafo_matrix_global_to_camera, K
                    ).astype(np.int32)
                    projected_right_boundary = project_polyline(
                        right_boundary, trafo_matrix_global_to_camera, K
                    ).astype(np.int32)
                    if (
                        not self.check_inside_image(
                            projected_right_boundary, self.width, self.height
                        )
                    ) or (
                        not self.check_inside_image(
                            projected_right_boundary, self.width, self.height
                        )
                    ):
                        spawn_waypoint = self.get_random_spawn_point(m)
                        continue
                    if len(projected_center) > 1:
                        pygame.draw.lines(
                            display, (255, 136, 0), False, projected_center, 4
                        )
                    if len(projected_left_boundary) > 1:
                        pygame.draw.lines(
                            display, (255, 0, 0), False, projected_left_boundary, 4
                        )
                    if len(projected_right_boundary) > 1:
                        pygame.draw.lines(
                            display,
                            (0, 255, 0),
                            False,
                            projected_right_boundary,
                            4,
                        )

                    in_lower_part_of_map = spawn_transform.location.y < 0

                    if self.store_files:
                        filename_base = simulation_identifier + "_frame_{}".format(
                            frame
                        )
                        if in_lower_part_of_map:
                            if (
                                np.random.rand() > 0.1
                            ):  # do not need that many files from validation set
                                continue
                            filename_base += "_validation_set"
                        # image
                        image_out_path = os.path.join(
                            self.data_folder, filename_base + ".png"
                        )
                        self.save_img(image_rgb, image_out_path)
                        # label img
                        label_path = os.path.join(
                            self.data_folder, filename_base + "_label.png"
                        )
                        self.save_label_img(
                            projected_left_boundary,
                            projected_right_boundary,
                            label_path,
                        )
                        # # borders
                        # border_array = np.hstack(
                        #     (np.array(left_boundary), np.array(right_boundary))
                        # )
                        # border_path = os.path.join(
                        #     data_folder, filename_base + "_boundary.txt"
                        # )
                        # np.savetxt(border_path, border_array)
                        # # trafo
                        # trafo_path = os.path.join(
                        #     data_folder, filename_base + "_trafo.txt"
                        # )
                        # np.savetxt(trafo_path, trafo_matrix_global_to_camera)
                        save_count += 1

                    curvature = self.get_curvature(center_list)
                    if curvature > 0.0005:
                        min_jump, max_jump = 1, 2
                    else:
                        min_jump, max_jump = 5, 10

                    pygame.display.flip()
                    frame += 1
                    
                    if save_count > self.store_file_number:
                        exit()

        finally:
            
            print("split train, test set")
            target_file_list = os.listdir(f'./{self.data_folder}')
            
            self.sort_collected_data(self.data_folder)
                

            print("destroying actors.")
            for actor in actor_list:
                actor.destroy()

            pygame.quit()
            print("done.")

if __name__ == "__main__":
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument("-w", "--weather", dest="weather", action="store")          # extra value
        parser.add_argument("-m", "--map", dest="map", action="store")          # extra value         # extra value
        parser.add_argument("-n", "--filenumber", dest="number", action="store")       
    
        args = parser.parse_args()
        # collector_bot = collector(weather_name=args.weather, map_name=args.map, store_file_number=int(args.filenumber))
        collector_bot = collector(weather_name=args.weather, map_name=args.map, store_file_number=3000)
        collector_bot.main()
        
    except KeyboardInterrupt:
        print("\nCancelled by user. Bye!")

