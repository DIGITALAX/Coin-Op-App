use std::time::{Duration, Instant};


pub trait Terminator {
    fn kill(&self) -> bool;

    fn new_timeout(&mut self, timeout: Duration);

    fn timeout_at(&self) -> Option<Instant>;
}

#[derive(Debug, Clone)]
pub struct BasicTerminator {
    pub timeout: Option<Instant>,
}

impl BasicTerminator {
    pub fn new() -> Self {
        Self { timeout: None }
    }
}

impl Terminator for BasicTerminator {
    fn kill(&self) -> bool {
        self.timeout.map_or(false, |timeout| Instant::now() > timeout)
    }

    fn new_timeout(&mut self, timeout: Duration){
        self.timeout = Some(Instant::now() + timeout);
    }

    fn timeout_at(&self) -> Option<Instant> {
        self.timeout
    }
}