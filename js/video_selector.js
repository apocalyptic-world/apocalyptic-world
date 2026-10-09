/**
 * Function to select correct video based on the provided parameters. a Prototype, need to overhaul video list 1st, arrange them by location, NPC race (White, Black, Asian, etc), and then by sex action along with body type if required(big_breast_consensual_missionary, forced_doggy, forced_doggy_standing, consensual_doggy_cum_inside, etc). This will allow for a more dynamic video selection process. and seprate data layer from ui layer so that in future, every file need not to be changed if video selection process is changed or file names are changed.
 */

setup.video_selector = {
    // more named parameters can be added as required in future as needed
    getVideoPath: function ({location, uniqueNPC, pack, race, sexType = "mf_straight",sexAction}) {
        if (!uniqueNPC || uniqueNPC === '') {
            if (!pack || pack === '') {
                if (!race || race === '') {
                    return `video/${location}/${sexAction}`; //check how many videos are of this type from VideoList. then Math.floor(Math.random() * (videoList.length + 1)) to select a random video from the list of videos of this type.
                }
                return `video/${location}/${sexAction}`; //check how many videos are of this type from VideoList. then Math.floor(Math.random() * (videoList.length + 1)) to select a random video from the list of videos of this type.
            }
            else {
                if (!location) {
                    return `packs/${pack}/actions/defaults/${sexAction}`;
                }
                else {
                    return `packs/${pack}/actions/${location}/${sexAction}`;
                }
            }
        }
        else {
            return `video/${uniqueNPC}/${sexAction}`;
        }
    },
    videoList: {
    // load actions files here
    }
}