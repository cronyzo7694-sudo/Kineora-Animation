use serde::{Deserialize, Serialize};

macro_rules! id_type {
    ($name:ident) => {
        #[derive(Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Debug, Serialize, Deserialize)]
        pub struct $name(pub u64);
    };
}

id_type!(NodeId);
id_type!(LayerId);
id_type!(SceneId);
